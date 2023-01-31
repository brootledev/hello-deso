# "Hello World!" at DeSo

This is super simple 1 page "Hello World" ReactJS app on DeSo Protocol based on this example https://github.com/deso-protocol/deso-examples-react

Let me explain the logic how it all works. 1st of all it is using Identity service and DeSo API both made my DeSo Core Team. Identity serive is separate service used to sign transactions. You need it when you make client side apps running in your browser. To make things easier the app is using @deso-core/identity JavaScript library that you can find here https://www.npmjs.com/package/@deso-core/identity 

If you have time and patience to understand how Identity service works you can review and reverse engineer DeSo frontent app aka BitClout, here is the code https://github.com/deso-protocol/frontend

Anyway, this app does two things: 1. Logs user, 2. Makes a post.

When you login Identity service gives you derived key and using that key you can manage what transactions can be allowed and can set limit of tokens that can be spent. I have no idea how it all works, I just copied this logic from example.

What you need to know is that in the code below you set limit on how much can be spent and that you can only make posts and you can only make 2 posts, after you make 2 posts, you will need new permission, link to code https://github.com/brootledev/hello-deso/blob/main/src/App.js#L145

      const permissionRequestResult = await identity.requestPermissions({
        GlobalDESOLimit: 0.01 * 1e9,  // 0.01 Deso
        TransactionCountLimitMap: {
          SUBMIT_POST: 2,             // getting permission to make 2 posts
        },
      });

So if you have permission you basically do these 3 steps

1. Create transaction via DeSo API, it can be anything, here this is post transaction `const result = await createPostTransaction(settings)` and if all is fine you will get `TransactionHex` as result
2. Now you need to use DeSo Identity serives to sign this transaction `const signedTransaction = await identity.signTx(TransactionHex)`
3. And after this you can finally submit signed transactions also via Identity service `const submittedTransaction = await identity.submitTx(signedTransaction)`

By the way, when you login using Identity service you only get public key, if you want username, you can fetch that username via DeSo API. It would be cool if Identity service could return username with public key, but it doesn't do that and I don't know why people from DeSo Team can't do it since DeSo Identity window displays usernames.
