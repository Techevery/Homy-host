import {google} from "googleapis";
import fs from "fs";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]
const KEY_FILE = "path/to/service-account-key.json"

const auth = new google.auth.GoogleAuth({
  keyFile:KEY_FILE,
  scopes:SCOPES,
});

const drive = google.drive({version:"v3", auth});

export const uploadToDrive = async(filePath:string, fileName:string, folderId:string) => {
  const fileMetaData = {
    name:fileName,
    parents:[folderId], // Target folder in Google Drive
  };

  const media = {
    mimeType:"image/jpeg",
    body:fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody:fileMetaData,
    media:media,
    fields:"id.webViewLink",
  });

  return response.data // Contains file ID and link
}