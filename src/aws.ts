import { S3 } from 'aws-sdk';
import fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

// prefix = output/asd123
export async function downloadS3Folder(prefix: string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: "vercel",
        Prefix: prefix
    }).promise();
    
    // 
    const allPromises = allFiles.Contents?.map(async ({Key}) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: "vercel",
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("awaiting");

    await Promise.all(allPromises?.filter(x => x !== undefined));
}

// Uploads the final dist folder to the s3 bucket
export function copyFinalDist(id: string) {
const folderPath = path.join(__dirname, `output/${id}/dist`);
const allFiles = getAllFiles(folderPath);
allFiles.forEach(file => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
})
}

// Recursively gets all files in a folder
const getAllFiles = (folderPath: string) => {
let response: string[] = [];

const allFilesAndFolders = fs.readdirSync(folderPath);allFilesAndFolders.forEach(file => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
        response = response.concat(getAllFiles(fullFilePath))
    } else {
        response.push(fullFilePath);
    }
});
return response;
}

// Uploads a file to the s3 bucket
const uploadFile = async (fileName: string, localFilePath: string) => {
const fileContent = fs.readFileSync(localFilePath);
const response = await s3.upload({
    Body: fileContent,
    Bucket: "vercel",
    Key: fileName,
}).promise();
console.log(response);
}
