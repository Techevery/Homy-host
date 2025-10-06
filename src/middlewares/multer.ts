import multer from "multer";

const storage  = multer.memoryStorage();

const upload = multer({
  storage,  
  limits:{fileSize: 5 * 1024 * 1024},
}).fields([
  {name:"profile_picture", maxCount: 1},
  {name:"id_card", maxCount: 1}
])

export default upload;