"use strict";
const path = require("path");
const fs = require("fs");
const filetorInit = require("express-fileupload");
const responseCode = {
  "FILETOR_SUCCESS_UPLOAD":2000,
  "FILETOR_MISSED_OBJECT_TYPE":1000,
  "FILETOR_MISSED_OBJECT":1001,
  "FILETOR_INCORRECT_FILE":1002,
  "FILETOR_INCORRECT_FILE_EXT":1003,
  "FILETOR_INCORRECT_UPLOAD_DIR_ERROR":1004,
  "FILETOR_UPLOAD_ERROR":1005,
  "FILETOR_MISSED_FILES":1006
  
};
const responseMsg = {
  1000:"You should pass an object to filetor(s) instance {file|files,allowedExtentions,dir}",
  1001:"required as a key in filetor(s) instance",
  1002:"Incorrect file format",
  1003:"extension not allowed",
  1004:"Make sure that uploaded directory created and the path is correct",
  1005:"Error happened while uploading",
  1006:"make sure you are sending all files",
  2000:"File uploaded successfully :)",

}
class Validator{
  response({name,path},{file,size,mimetype},{code,msg}){
    if(name&&path){
      return {
        upload:true,
        name,
        path,
        code,
        msg,
        size,
        mimetype,
        originalName:file,
      }
    }else{
      return {
        upload:false,
        code,
        msg,
        size:size?size:"",
        mimetype:mimetype?mimetype:"",
        originalName:file?file:"",
        name:"",
        path:""
      }
    }
  }
  extentionValidator({name,mimetype}, arr){
    try{
      let ext = mimetype.split("/");
      let extention = path.extname(name).substr(1)||ext[1];
      return {
          status:arr.includes(extention),
          extention:{code:responseCode.FILETOR_INCORRECT_FILE_EXT,msg:`(${extention}) ${responseMsg[responseCode.FILETOR_INCORRECT_FILE_EXT]}`}
      }
    }catch(err){
      return {
        status:false,
        extention:{code:responseCode.FILETOR_INCORRECT_FILE,msg:`${responseMsg[responseCode.FILETOR_INCORRECT_FILE]} ${err}`}
      }
    }
    
  }
  checkRequired(fileds){
    if(typeof fileds !=="object"){
      return {code:responseCode.FILETOR_MISSED_OBJECT_TYPE,msg:responseMsg[responseCode.FILETOR_MISSED_OBJECT_TYPE]};
    }
    const errors = fileds
      .filter((element) => {
        return !element.value;
      })
      .map((element) => {
        return `${element.key}`;
      });
    if(errors.length){
      return {code:responseCode.FILETOR_MISSED_OBJECT,msg:`${errors} ${responseMsg[responseCode.FILETOR_MISSED_OBJECT]}`};
    }
  }
  directoryCheckAndCreate(dir){
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, 0o755);
    }
  }
}
class Filetor extends Validator{
  single(upload){
    let { file, dir, allowedExtentions } = upload || {};
    let {name,size,mimetype} = file||{};
    let errors = super.checkRequired([
      { key:"file",value:file},
      { key: "dir", value: dir },
      { key: "allowedExtentions", value: allowedExtentions },
    ]);
    if(errors){
      return new Promise((resolve,reject)=>{
        resolve(super.response({},{},errors));
      });
    }
    let {status,extention} = super.extentionValidator(file, allowedExtentions);
    if (!status) {
      return new Promise((resolve,reject)=>{
          if(name&&size&&mimetype){
            resolve(super.response({},{file:name,size,mimetype},extention));
          }else{
            resolve(super.response({},{name},extention));
          }
      });
    }
    return new Promise((resolve,reject)=>{
      try{
        super.directoryCheckAndCreate(dir);
      }catch(err){
        resolve(super.response({},{file:name,size,mimetype},{code:responseCode.FILETOR_INCORRECT_UPLOAD_DIR_ERROR,msg:`${responseMsg[responseCode.FILETOR_INCORRECT_UPLOAD_DIR_ERROR]} ${err}`}));
      }
        let fileName = Date.now() + `_${name}`;
        file.mv(`/${dir}/${fileName}`, (err) => {
              if (err) {
                resolve(super.response({},{file:name,size,mimetype},{code:responseCode.FILETOR_UPLOAD_ERROR,msg:`${responseMsg[responseCode.FILETOR_UPLOAD_ERROR]} ${name} ${err}`}));
              } else {
                resolve(super.response({path:`${dir}/${fileName}`,name:fileName},{file:name,size,mimetype},{code:responseCode.FILETOR_SUCCESS_UPLOAD,msg:`${responseMsg[responseCode.FILETOR_SUCCESS_UPLOAD]}`}));
              }
          });
    });
  }
  multiple(upload){
    let { files, dir, allowedExtentions} = upload || {};
    let errors = super.checkRequired([
      { key:"files",value:files},
      { key: "dir", value: dir },
      { key: "allowedExtentions", value: allowedExtentions },
    ]);
    if(errors){
      return new Promise((resolve,reject)=>{
        resolve(super.response({},{},errors));
    });
    }
  let promises=[];
  let fileCopy=0;
  let fileIndex=0;
  for(let file of files){
      if(!file){
        return new Promise((resolve,reject)=>{
          let error = {code:responseCode.FILETOR_MISSED_FILES,msg:`files[${fileIndex}] empty one ${responseMsg[responseCode.FILETOR_MISSED_FILES]}`};
          resolve(super.response({},{},error));
        });
      }
      fileIndex++;
      let {name,mimetype,size}=file;
      let {status,extention} = super.extentionValidator(file, allowedExtentions);
      if (!status) {
        return new Promise((resolve,reject)=>{
            if(name&&size&&mimetype){
              resolve(super.response({},{file:name,size,mimetype},extention));
            }else{
              resolve(super.response({},{name},extention));
            }
        });
    }
    let promise = new Promise((resolve,reject)=>{
          super.directoryCheckAndCreate(dir);
          let fileName = Date.now() + `${fileCopy}_${name}`;
          return file.mv(`/${dir}/${fileName}`, (err) => {
            if (err) {
              resolve(super.response({},{file:name,size,mimetype},{code:responseCode.FILETOR_UPLOAD_ERROR,msg:`${responseMsg[responseCode.FILETOR_UPLOAD_ERROR]} ${name} ${err}`}));
            } else {
              resolve(super.response({path:`${dir}/${fileName}`,name:fileName},{file:name,size,mimetype},{code:responseCode.FILETOR_SUCCESS_UPLOAD,msg:`${responseMsg[responseCode.FILETOR_SUCCESS_UPLOAD]}`}));
            }
          });
    });
    promises.push(promise);
    fileCopy++;
    }
    return Promise.all(promises);
  }
}
let filetor = new Filetor();
module.exports = {
    filetorInit,
    filetor:filetor.single,
    filetors:filetor.multiple
};
