import { useState } from "react";
import "./App.css";
import {
  auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "./utils/firebase";
import type { User } from "firebase/auth";
import { LoadingAnimation } from "./components/LoadingAnimation";

function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User>();
  const [googleIsLoading, setGoogleIsLoading] = useState(false);

  const [registerDetails, setRegisterDetails] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [registerIsLoading, setRegisterIsLoading] = useState(false);

  const [loginDetails, setLoginDetails] = useState({
    email: "",
    password: "",
  });
  const [loginIsLoading, setLoginIsLoading] = useState(false);

  const googleLogin = async () => {
    try {
      setGoogleIsLoading(true);
      const provider = new GoogleAuthProvider();
      const resp = await signInWithPopup(auth, provider);
      const user: User = resp.user;
      setUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setGoogleIsLoading(false);
    }
  };

  const registerEmailPass = async () => {
    try {
      setRegisterIsLoading(true);
      const check = await createUserWithEmailAndPassword(
        auth,
        registerDetails?.email,
        registerDetails?.password
      );
      const user: User = check.user;

      await updateProfile(user, {
        displayName: registerDetails?.name,
      });

      setUser(user);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        window.alert(err?.message);
      }
    } finally {
      setRegisterIsLoading(false);
    }
  };

  const loginEmailPass = async () => {
    try {
      setLoginIsLoading(true);
      const check = await signInWithEmailAndPassword(
        auth,
        loginDetails?.email,
        loginDetails?.password
      );
      const user: User = check.user;
      setUser(user);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        window.alert(err?.message);
      }
    } finally {
      setLoginIsLoading(false);
    }
  };

   const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha', {
        size: 'invisible',
      }, auth);
    }
  };

  const phoneAuth = () => {
    try {

    } catch (err) {

    }
  }

  return (
    <main className="h-screen w-full p-10">
      <h1 className="font-bold text-4xl text-center">FIREBASE</h1>
      <div className="w-full h-full flex flex-col gap-2 items-start">
        <p className="underline font-medium">Authentication</p>
        <div className="flex flex-row gap-5 items-start justify-start w-full">
          <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-center">
            <p className="text-purple-600">Google</p>
            {googleIsLoading ? (
              <div className="w-14 h-14 w-full flex justify-center">
                <LoadingAnimation />
              </div>
            ) : (
              <button
                className="bg-black text-white rounded-xl p-2 cursor-pointer hover:bg-gray-600 duration-300"
                onClick={googleLogin}
              >
                Google login
              </button>
            )}
          </div>

          <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-start">
            <p className="text-purple-600 text-center w-full">
              Email/password register
            </p>
            <label htmlFor="email">Name</label>
            <input
              type="text"
              id="name"
              value={registerDetails?.name}
              onChange={(e) =>
                setRegisterDetails((preVal) => ({
                  ...preVal,
                  name: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={registerDetails?.email}
              onChange={(e) =>
                setRegisterDetails((preVal) => ({
                  ...preVal,
                  email: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            <label htmlFor="email">Password</label>
            <input
              type="text"
              id="password"
              value={registerDetails?.password}
              onChange={(e) =>
                setRegisterDetails((preVal) => ({
                  ...preVal,
                  password: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            {registerIsLoading ? (
              <div className="w-14 h-14 w-full flex justify-center">
                <LoadingAnimation />
              </div>
            ) : (
              <button
                className="bg-black text-white rounded-xl p-2 cursor-pointer hover:bg-gray-600 duration-300 mt-5 w-full"
                onClick={registerEmailPass}
              >
                Register
              </button>
            )}
          </div>

          <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-start">
            <p className="text-purple-600 text-center w-full">
              Email/password register
            </p>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={loginDetails?.email}
              onChange={(e) =>
                setLoginDetails((preVal) => ({
                  ...preVal,
                  email: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            <label htmlFor="email">Password</label>
            <input
              type="text"
              id="password"
              value={loginDetails?.password}
              onChange={(e) =>
                setLoginDetails((preVal) => ({
                  ...preVal,
                  password: e.target.value,
                }))
              }
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            {loginIsLoading ? (
              <div className="w-14 h-14 w-full flex justify-center">
                <LoadingAnimation />
              </div>
            ) : (
              <button
                className="bg-black text-white rounded-xl p-2 cursor-pointer hover:bg-gray-600 duration-300 mt-5 w-full"
                onClick={loginEmailPass}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
