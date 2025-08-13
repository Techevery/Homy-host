import path from "path";

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Filesystem Disk
  |--------------------------------------------------------------------------
  |
  | Here you may specify the default filesystem disk that should be used
  | by the framework. The "local" disk, as well as a variety of cloud
  | based disks are available to your application. Just store away!
  |
  */
  default: process.env.FILESYSTEM || 'local',
  /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Here you may configure as many filesystem "disks" as you wish, and you
    | may even configure multiple disks of the same driver. Defaults have
    | been setup for each driver as an example of the required options.
    |
    | Supported Drivers: "local", "s3", "cloudinary",
    |
    */
  disks:{
    local:{
      driver:"local",
      root:path.join(__dirname, "../../" + process.env.UPLOADS_DIR),
    },
    cloudinary:{
      driver:"cloudinary",
      cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
      api_key:process.env.CLOUDINARY_API_KEY,
      api_secret:process.env.CLOUDINARY_API_SECRET,
      secure:true,
    },

    s3: {
      driver: 's3',
      key: process.env.AWS_ACCESS_KEY_ID || '',
      secret: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_DEFAULT_REGION || '',
      bucket: process.env.AWS_BUCKET || '',
      url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com`,
    },
  }
}