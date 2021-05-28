# Filetor
Simple npm package for uploading single and multiple files using nodejs.
# Installing
```bash
npm i filetor
```
# Usage:
Used for uploading files in nodejs the file will be accessible from `req.files`

### Example: uploading single file

- You are uploading profile image in a sign-up page.
- HTML form input `<input name="profileImg" type="file">`.
- In `/register` end-point we will access the uploaded file from `req.files.profileImg`
```js
app.post('/register', function(req, res) {
  console.log(req.files.profileImg); // the uploaded file object
});
```

The **req.files.profileImg** object will contain the following:
* `req.files.profileImg.name`: "avatar.jpg"
* `req.files.profileImg.mv`: A function to move the file elsewhere on your server. Can take a callback or return a promise.
* `req.files.profileImg.mimetype`: The mimetype of your file
* `req.files.profileImg.data`: A buffer representation of your file, returns empty buffer in case useTempFiles option was set to true.
* `req.files.profileImg.tempFilePath`: A path to the temporary file in case useTempFiles option was set to true.
* `req.files.profileImg.truncated`: A boolean that represents if the file is over the size limit
* `req.files.profileImg.size`: Uploaded size in bytes
* `req.files.profileImg.md5`: MD5 checksum of the uploaded file

```js
app.post("/register",async (req,res,next)=>{
    let  profileImage = req.files.profileImg;
    let upload = await  filetor({file:profileImage,dir:path.join(__dirname,uploadDirectory),allowedExtentions});    
    return  res.json(upload)
});

```

### Example: uploading single file

- You are selling your car online.
- HTML form input `<input type="file" name="car[]" />`
- In `/advertisment` wnd-point we will access the uploaded files from `req.files.car`

```js
app.post("/advertisment",async (req,res,next)=>{
    let  carImages = req.files.car;
    let upload = await  filetors({files:carImages,dir:path.join(__dirname,uploadDirectory),allowedExtentions});    
    return  res.json(upload)
});

```
