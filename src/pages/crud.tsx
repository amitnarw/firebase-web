import { useState } from "react";
import { LoadingAnimation } from "../components/LoadingAnimation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "../utils/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const crud = () => {
  const [isReadLoading, setIsReadLoading] = useState(false);
  const [posts, setPosts] = useState<
    | {
        id: string;
        title: string;
        description: string;
        image: string;
        uid: string;
      }[]
    | null
  >(null);
  const [isWriteLoading, setIsWriteLoading] = useState(false);
  const [postDetails, setPostsDetails] = useState<{
    title: string;
    description: string;
    image: File | string | null;
  }>({
    title: "",
    description: "",
    image: null,
  });

  const [isEdit, setIsEdit] = useState(false);
  const [editDeleteIsLoading, setEditDeleteIsLoading] = useState({
    id: "",
    status: false,
  });

  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<
    | {
        email: string;
        name: string;
        phone: number;
        uid: string;
      }[]
    | null
  >(null);

  const [selectedUser, setSelectedUser] = useState("Select a user");
  const [isLoadingSelectedUserPosts, setIsLoadingSelectedUserPosts] =
    useState(false);
  const [selectedUserPosts, setSelectedUserPosts] = useState<
    | {
        title: string;
        description: string;
        image: File | string | null;
        id: string;
      }[]
    | null
  >(null);

  const getData = async () => {
    setIsReadLoading(true);
    const result = await getDocs(collection(db, "posts"));
    const data: any = result.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        title: string;
        description: string;
        image: string;
      }),
    }));
    setPosts(data);
    setIsReadLoading(false);
  };

  const addData = async () => {
    if (
      !postDetails?.title ||
      !postDetails?.description ||
      !postDetails?.image
    ) {
      window.alert("Title, description and image are required");
    } else {
      setIsWriteLoading(true);
      const fileRef = ref(
        storage,
        Date.now() +
          "-" +
          (postDetails?.image instanceof File && postDetails?.image?.name)
      );
      if (postDetails?.image instanceof File && postDetails?.image) {
        await uploadBytes(fileRef, postDetails?.image);
      }
      const fileURL = await getDownloadURL(fileRef);
      const checkUser = localStorage.getItem("user");
      let userData;
      if (checkUser) {
        userData = JSON.parse(checkUser);
      }
      await addDoc(collection(db, "posts"), {
        ...postDetails,
        image: fileURL,
        ...(userData?.email
          ? { email: userData?.email }
          : userData?.phoneNumber
          ? { phoneNumber: userData?.phoneNumber }
          : ""),
        uid: userData?.uid,
      });
      setIsWriteLoading(false);

      setPostsDetails({
        title: "",
        description: "",
        image: null,
      });
      window.alert("New post added");
    }
  };

  const selectDataToEdit = async (index: number, id: string) => {
    setIsEdit(true);
    setEditDeleteIsLoading({ id, status: true });
    if (posts) {
      setPostsDetails({
        title: posts[index]?.title,
        description: posts[index]?.description,
        image: "",
      });
    }
    setEditDeleteIsLoading({ id, status: false });
  };

  const selectDataToAdd = () => {
    setIsEdit(false);
    setPostsDetails({
      title: "",
      description: "",
      image: null,
    });
  };

  const editData = async () => {
    if (!postDetails?.title || !postDetails?.description) {
      window.alert("Title, description and image are required");
    } else {
      setIsWriteLoading(true);
      let fileURL;
      if (postDetails?.image) {
        const fileRef = ref(
          storage,
          Date.now() +
            "-" +
            (postDetails?.image instanceof File && postDetails?.image?.name)
        );
        if (postDetails?.image instanceof File) {
          await uploadBytes(fileRef, postDetails?.image);
        }
        fileURL = await getDownloadURL(fileRef);
      }
      const editRef = doc(db, "posts", editDeleteIsLoading?.id);
      await updateDoc(editRef, {
        title: postDetails?.title,
        description: postDetails?.description,
        ...(fileURL && { image: fileURL }),
      });

      setIsWriteLoading(false);
      setPostsDetails({
        title: "",
        description: "",
        image: null,
      });
      window.alert("Post updated");
    }
  };

  const deleteData = async (id: string) => {
    setEditDeleteIsLoading({ id, status: true });
    await deleteDoc(doc(db, "posts", id));
    setEditDeleteIsLoading({ id, status: false });
    setPostsDetails({
      title: "",
      description: "",
      image: null,
    });
    window.alert("Post deleted");
  };

  const getAllUsers = async () => {
    try {
      setIsLoadingAllUsers(true);
      const res = await getDocs(collection(db, "users"));
      console.log(res.docs);
      const users: any = res.docs.map((user) => user.data());
      setAllUsers(users);
    } catch (err: any) {
      window.alert("Error while getting all users: " + err.message);
    } finally {
      setIsLoadingAllUsers(false);
    }
  };

  const selectUserToLoadPosts = async (uid: string) => {
    try {
      setIsLoadingSelectedUserPosts(true);
      setSelectedUser(uid);
      const qry = query(collection(db, "posts"), where("uid", "==", uid));
      const snapshot = await getDocs(qry);
      const posts: any = snapshot.docs.map((post) => ({
        id: post.id,
        ...post.data(),
      }));
      setSelectedUserPosts(posts);
    } catch (err: any) {
      window.alert("Error while getting data of selected user: " + err.message);
    } finally {
      setIsLoadingSelectedUserPosts(false);
    }
  };

  console.log(posts, "opppopopopo");

  return (
    <div className="flex flex-col gap-2">
      <p className="underline font-medium">Firestore</p>
      <div className="flex flex-row gap-5">
        <div className="border border-gray-300 rounded-xl p-4">
          <div className="flex flex-row items-center justify-between mb-1">
            <p className="text-purple-500">Get / edit / delete data</p>
            <button
              onClick={getData}
              className="rounded-xl px-4 p-1 text-white bg-cyan-500"
            >
              Fetch
            </button>
          </div>
          {isReadLoading ? (
            <div className="flex items-center justify-center w-14 h-14 m-auto">
              <LoadingAnimation />
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {posts && posts.length > 0 ? (
                posts.map((item, index) => (
                  <ListView
                    item={item}
                    index={index}
                    editDeleteIsLoading={editDeleteIsLoading}
                    selectDataToEdit={selectDataToEdit}
                    deleteData={deleteData}
                    key={item?.id}
                  />
                ))
              ) : (
                <p className="text-gray-500">No data found</p>
              )}
            </ul>
          )}
        </div>

        <div className="border border-gray-300 rounded-xl p-4">
          <div className="flex flex-row items-center justify-between">
            <p className="text-purple-500">Add / edit data</p>
            <button
              onClick={selectDataToAdd}
              className="rounded-xl px-4 p-1 text-white bg-cyan-500"
            >
              Add
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={postDetails?.title}
              onChange={(e) =>
                setPostsDetails((preVal) => ({
                  ...preVal,
                  title: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            <label htmlFor="title">Description</label>
            <input
              type="text"
              id="description"
              value={postDetails?.description}
              onChange={(e) =>
                setPostsDetails((preVal) => ({
                  ...preVal,
                  description: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            <label htmlFor="title">File</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={(e) =>
                setPostsDetails((preVal) => ({
                  ...preVal,
                  image: e.target.files ? e.target.files[0] : null,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            {postDetails?.image && (
              <img
                src={
                  postDetails?.image
                    ? postDetails?.image instanceof File
                      ? URL.createObjectURL(postDetails?.image)
                      : postDetails?.image
                    : ""
                }
                alt="choosen"
                className="h-20 object-cover rounded-xl"
              ></img>
            )}
            {isWriteLoading ? (
              <div className="flex items-center justify-center w-14 h-14 m-auto">
                <LoadingAnimation />
              </div>
            ) : isEdit ? (
              <button
                onClick={editData}
                className="rounded-xl px-4 p-1 text-white bg-purple-500"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={addData}
                className="rounded-xl px-4 p-1 text-white bg-cyan-500"
              >
                Add
              </button>
            )}
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between gap-2">
            <p className="text-purple-500">Data according to user</p>
            {isLoadingAllUsers ? (
              <div className="flex items-center justify-center w-14 h-14 m-auto">
                <LoadingAnimation />
              </div>
            ) : (
              <button
                onClick={getAllUsers}
                className="rounded-xl px-4 p-1 text-white bg-cyan-500"
              >
                Get all users
              </button>
            )}
          </div>

          {allUsers ? (
            <select
              className="w-full p-1 px-2 bg-gray-100 rounded-md"
              value={selectedUser}
              onChange={(e) => selectUserToLoadPosts(e.target.value)}
            >
              <option hidden>Select a user</option>
              {allUsers?.map((user) => (
                <option key={user?.uid} value={user?.uid}>
                  {user?.email
                    ? `email: ${user?.email}`
                    : `phone: ${user?.phone}`}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-500">No users found</p>
          )}

          {isLoadingSelectedUserPosts ? (
            <div className="flex items-center justify-center w-14 h-14 m-auto">
              <LoadingAnimation />
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {selectedUserPosts && selectedUserPosts.length > 0 ? (
                selectedUserPosts.map((item, index) => (
                  <ListView
                    item={item}
                    index={index}
                    editDeleteIsLoading={editDeleteIsLoading}
                    selectDataToEdit={selectDataToEdit}
                    deleteData={deleteData}
                    key={item?.id}
                  />
                ))
              ) : (
                <p className="text-gray-500">No data found</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default crud;

const ListView = ({
  item,
  index,
  editDeleteIsLoading,
  selectDataToEdit,
  deleteData,
}: any) => {
  return (
    <li
      key={item?.id}
      className="flex flex-row gap-2 p-2 rounded-xl bg-gray-100"
    >
      <img
        src={item?.image}
        alt={item?.id}
        className="w-20 h-20 rounded-lg object-cover"
      ></img>
      <div className="flex flex-col gap-1 items-start justify-start">
        <span>id: {item?.id}</span>
        <span>title: {item?.title}</span>
        <span>description: {item?.description}</span>
        {editDeleteIsLoading?.status && editDeleteIsLoading?.id === item?.id ? (
          <div className="flex items-center justify-center w-14 h-14 m-auto">
            <LoadingAnimation />
          </div>
        ) : (
          <div className="flex flex-row gap-2">
            <button
              className="bg-purple-500 rounded-lg text-sm px-2 py-1 cursor-pointer text-white"
              onClick={() => selectDataToEdit(index, item?.id)}
            >
              Edit
            </button>
            <button
              className="bg-red-500 rounded-lg text-sm px-2 py-1 cursor-pointer text-white"
              onClick={() => deleteData(item?.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
};
