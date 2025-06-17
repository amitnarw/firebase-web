import { getDownloadURL, listAll, ref } from "firebase/storage";
import { useState } from "react";
import { db, storage } from "../utils/firebase";
import { LoadingAnimation } from "../components/LoadingAnimation";

const Storage = () => {
  const [isReadLoading, setIsReadLoading] = useState(false);
  const [filesList, setFilesList] = useState<string[]>([]);

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
                  <li key={item}>
                    <img
                      src={item}
                      alt={item}
                      className="w-50 h-50 rounded-xl object-cover"
                    ></img>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No images files found</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Storage;
