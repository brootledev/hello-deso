import './App.css';

import { useEffect, useState } from "react";

import { identity } from '@deso-core/identity';

const apiPrefix = 'https://node.deso.org/api/v0/'

function App() {

  const [loggedUser, setLoggedUser] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const [postText, setPostText] = useState('');
  const [postingInProgress, setPostingInProgress] = useState(false);
  const [lastPostedPost, setLastPostedPost] = useState(undefined)

  useEffect(() => {
    identity.subscribe((state) => {
      setLoading(false)
      const {currentUser} = state;
      setLoggedUser(currentUser?.publicKey)
    });    
  }, [])

  const login = async () => {
    setLoading(true)
    await identity.login();
  }

  const logout = async () => {
    setLoading(true)
    await identity.logout();
  }  

  const createPostTransaction = async (settings) => {

    let {
            UpdaterPublicKeyBase58Check, 
            ParentStakeID = '', 
            RepostedPostHashHex = '',
            PostHashHexToModify = '',
            Body = '', 
            ImageURLs = null,
            VideoURLs = null,
            PostExtraData = null,
            MinFeeRateNanosPerKB
        } = settings

    const data = {
        "UpdaterPublicKeyBase58Check": UpdaterPublicKeyBase58Check,
        "PostHashHexToModify": PostHashHexToModify,
        "ParentStakeID": ParentStakeID,
        "Title": "",
        "BodyObj": {
            "Body": Body,
            "ImageURLs": ImageURLs,
            "VideoURLs": VideoURLs
        },
        "RepostedPostHashHex": RepostedPostHashHex,
        "PostExtraData": PostExtraData,
        "MinFeeRateNanosPerKB": MinFeeRateNanosPerKB,
    }
  
    const url = `${apiPrefix}submit-post`
  
    const params = {
        method:'POST',
        body:JSON.stringify(data),
        headers: { 'Content-Type': 'application/json'}
    }
  
    try {
        const res = await fetch(url, params)
        const result = await res.json()   
        return {...result}        
    } catch (error) {
        return {...error} 
    }


  }  

  const submitPost = async () => {
    
    let settings = {
      UpdaterPublicKeyBase58Check: loggedUser,
      MinFeeRateNanosPerKB: 1000,
      Body: postText
    }    

    const result = await createPostTransaction(settings)      

    const {error, TransactionHex} = result

    if(error) {
      console.log("error: ", error)
    }

    if(TransactionHex){
      // post transaction was succesfully created via DeSo API
      try {
        // we need to sign transaction
        const signedTransaction = await identity.signTx(TransactionHex)
        // now we can submit signed transaction
        const submittedTransaction = await identity.submitTx(signedTransaction)
        
        // result of succesfully submitted transaction has all data that can be used to render this transaction in UI
        // if this was a post, everything is in PostEntryResponse object
        // must be careful and not to immidatelly interact with this post as it might be not available yet for interaction
        const {PostEntryResponse} = submittedTransaction
        console.log("PostEntryResponse: ", PostEntryResponse)   

        setLastPostedPost(PostEntryResponse)
        setPostingInProgress(false)

      } catch (error) {
        console.log("error: ", error)
        setPostingInProgress(false)
      }
    }            
  }

  const initiatePostFlow = async () => {

    // 1st need to check if there is permission to post
    // if there is no permission - request permission

    setPostingInProgress(true)

    let hasPermissionstoPost = identity.hasPermissions({
        TransactionCountLimitMap: {
          SUBMIT_POST: 1,
        },
    })    

    // if there is permission, just make a post
    if(hasPermissionstoPost){
      submitPost()
    }   

    // if no permission
    if (!hasPermissionstoPost) {
      // if the user doesn't have permissions, request them
      const permissionRequestResult = await identity.requestPermissions({
        GlobalDESOLimit: 0.01 * 1e9,  // 0.01 Deso
        TransactionCountLimitMap: {
          SUBMIT_POST: 2,             // getting permission to make 2 posts
        },
      });

      console.log("permissionRequestResult: ", permissionRequestResult)
      
      // here we asume that we got permission to make 2 posts

      submitPost()
      
    }      

  

  }

  return (
    <div className="App">
      <h1>DeSo "Hello World!" App</h1>

      {
        loggedUser && <div>Logged: {loggedUser}</div>
      }

      <div>
        {
          loggedUser 
          ? <button onClick={logout} disabled={loading}>Logout</button>
          : <button onClick={login} disabled={loading}>Login</button>
        }
      </div>

      {
        loggedUser &&
        <div>

          <textarea value={postText} onChange={(e) => setPostText(e.target.value)}></textarea>
          <div>
            <button onClick={initiatePostFlow} disabled={loading}>Post</button>
          </div>
        </div>
      }

      { postingInProgress && <div>Posting...</div>}

      {
        lastPostedPost && !postingInProgress &&
        <div>
          Your post: <strong>{lastPostedPost?.Body}</strong> 
        </div>
      }
    </div>
  );
}

export default App;
