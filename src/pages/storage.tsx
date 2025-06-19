import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { useState } from "react";
import { db, storage } from "../utils/firebase";
import { LoadingAnimation } from "../components/LoadingAnimation";
import type { FirebaseError } from "firebase/app";

const Storage = () => {
  const [isReadLoading, setIsReadLoading] = useState(false);
  const [filesList, setFilesList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [isFileDeleting, setIsFileDeleting] = useState({
    id: "",
    status: false,
  });

  const getAllFiles = async () => {
    setIsReadLoading(true);
    const listRef = ref(storage);
    let data = await listAll(listRef);
    let finalList = await Promise.all(
      data?.items?.map(async (item) => {
        return await getDownloadURL(item);
      })
    );
    setFilesList(finalList);
    setIsReadLoading(false);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      window.alert("Select a file first");
      return;
    }
    setIsFileUploading(true);
    const fileRef = ref(
      storage,
      Date.now() + "-" + (selectedFile instanceof File && selectedFile?.name)
    );
    if (selectedFile instanceof File && selectedFile?.name) {
      // await uploadBytes(fileRef, selectedFile);
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);
      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot?.bytesTransferred / snapshot?.totalBytes) * 100;
          setUploadPercentage(Number(progress.toFixed(2)));
        },
        (error: FirebaseError) =>
          console.log("Error while uploading file: " + error),
        () => {
          setIsFileUploading(false);
          window.alert("File uploaded");
        }
      );
    }
  };

  const deleteFile = async (name: string) => {
    setIsFileDeleting({ id: name, status: true });
    const fileRef = ref(storage, name);
    await deleteObject(fileRef);
    window.alert("File deleted");
    setIsFileDeleting({ id: name, status: false });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="underline font-medium">Storage</p>
      <div className="flex flex-row gap-5">
        <div className="border border-gray-300 rounded-xl p-4">
          <div className="flex flex-row items-center justify-between mb-1">
            <p className="text-purple-500">List all files</p>
            <button
              onClick={getAllFiles}
              className="rounded-xl px-4 p-1 text-white bg-cyan-500"
            >
              Get
            </button>
          </div>
          {isReadLoading ? (
            <div className="flex items-center justify-center w-14 h-14 m-auto">
              <LoadingAnimation />
            </div>
          ) : (
            <ul className="flex flex-col gap-2 items-center justify-center">
              {filesList?.length > 0 ? (
                filesList?.map((item) => (
                  <li
                    key={item}
                    className="flex flex-col items-center justify-center"
                  >
                    <img
                      src={item}
                      alt={item}
                      className="w-50 h-50 rounded-xl object-cover"
                    ></img>
                    <div className="flex flex-row items-center justify-between">
                      <p className="line-clamp-1">{item}</p>
                      {isFileDeleting?.id === item && isFileDeleting?.status ? (
                        <div className="flex items-center justify-center w-14 h-14 m-auto">
                          <LoadingAnimation />
                        </div>
                      ) : (
                        <button
                          className="bg-red-500 text-white py-1 px-2 text-sm rounded-xl"
                          onClick={() => deleteFile(item)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No images found</p>
              )}
            </ul>
          )}
        </div>

        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-purple-500">Upload file</p>
          <label htmlFor="title">File</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) =>
              setSelectedFile(e.target.files ? e.target.files[0] : null)
            }
            className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
          ></input>
          {selectedFile && (
            <img
              src={
                selectedFile
                  ? selectedFile instanceof File
                    ? URL.createObjectURL(selectedFile)
                    : selectedFile
                  : ""
              }
              alt="choosen"
              className="h-20 object-cover rounded-xl"
            ></img>
          )}
          {isFileUploading ? (
            <div className="flex flex-row gap-2 items-center justify-center">
              <div className="w-14 h-14">
                <LoadingAnimation />
              </div>
              <p>{uploadPercentage} %</p>
            </div>
          ) : (
            <button
              onClick={uploadFile}
              className="rounded-xl px-4 p-1 text-white bg-cyan-500"
            >
              Upload file
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Storage;
