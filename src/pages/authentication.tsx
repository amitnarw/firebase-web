import {
  auth,
  createUserWithEmailAndPassword,
  db,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
} from "../utils/firebase";
import type { ConfirmationResult, User } from "firebase/auth";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { useEffect, useState } from "react";
import { addDoc, collection } from "firebase/firestore";

const authentication = () => {
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

  const [phoneNumber, setPhoneNumber] = useState<number | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState<number | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isLoadingPhoneLogin, setIsLoadingPhoneLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            // size: "normal",
            callback: (response: any) => {
              setShowOtp(true);
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
            },
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
    const data = localStorage.getItem("user");
    if (data && !user) {
      setUser(JSON.parse(data));
    }
  }, [user]);

  const googleLogin = async () => {
    try {
      setGoogleIsLoading(true);
      const provider = new GoogleAuthProvider();
      const resp = await signInWithPopup(auth, provider);
      const userData: User = resp.user;
      localStorage.setItem("user", JSON.stringify(userData));
      await addUserToFirestore(
        userData?.email ?? "",
        userData?.displayName ?? "",
        Number(userData?.phoneNumber),
        userData?.uid
      );
      setUser(userData);
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
      const userData: User = check.user;

      await updateProfile(userData, {
        displayName: registerDetails?.name,
      });

      await addUserToFirestore(
        userData?.email ?? "",
        userData?.displayName ?? "",
        Number(userData?.phoneNumber),
        userData?.uid
      );

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

  const getOtp = async () => {
    try {
      if (!phoneNumber) {
        window.alert("Please input phone number");
        return;
      }
      setIsLoadingPhoneLoading(true);
      let res = await signInWithPhoneNumber(
        auth,
        "+" + phoneNumber?.toString(),
        window.recaptchaVerifier
      );
      setConfirmationResult(res);
      setShowOtp(true);
    } catch (err: any) {
      window.alert("Error while sending OTP: " + err?.message);
    } finally {
      setIsLoadingPhoneLoading(false);
    }
  };

  const loginWithOTP = async () => {
    setIsLoadingPhoneLoading(true);
    if (confirmationResult && code) {
      try {
        let check = await confirmationResult.confirm(code?.toString());
        setUser(check?.user);
        localStorage.setItem("user", JSON.stringify(check?.user));
        await addUserToFirestore(
          check?.user?.email ?? "",
          check?.user?.displayName ?? "",
          Number(check?.user?.phoneNumber),
          check?.user?.uid
        );
      } catch (err) {
        window.alert("Error while confirming OTP: " + err);
      } finally {
        setIsLoadingPhoneLoading(false);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(undefined);
  };

  const addUserToFirestore = async (
    email: string,
    name: string,
    phone: number,
    uid: string
  ) => {
    try {
      await addDoc(collection(db, "users"), {
        email,
        name,
        phone,
        uid,
      });
    } catch (err: any) {
      window.alert(
        "Error while adding user data to firestore: " + err?.message
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 items-start">
      <div className="flex flex-row gap-5 items-center">
        <p className="underline font-medium">Authentication</p>
        {user ? (
          <p className="text-green-500">USER IS LOGGED IN</p>
        ) : (
          <p className="text-red-500">USER IS NOT LOGGED IN</p>
        )}
        {user && (
          <button
            className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm cursor-pointer"
            onClick={logout}
          >
            Logout
          </button>
        )}
      </div>
      <div className="flex flex-row gap-5 items-start justify-start w-full">
        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-center">
          <p className="text-purple-600">Google</p>
          {googleIsLoading ? (
            <div className="w-14 h-14 flex justify-center">
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
            <div className="w-14 h-14 flex justify-center">
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
          <label htmlFor="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            value={loginDetails?.email}
            onChange={(e) =>
              setLoginDetails((preVal) => ({
                ...preVal,
                email: e.target.value,
              }))
            }
            className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
          ></input>
          <label htmlFor="login-password">Password</label>
          <input
            type="text"
            id="login-password"
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
            <div className="w-14 h-14 flex justify-center">
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

        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-2 items-start">
          <p className="text-purple-600 text-center w-full">
            Phone number login
          </p>
          <div id="recaptcha-container"></div>

          {showOtp ? (
            <>
              <label htmlFor="otp">OTP</label>
              <input
                type="number"
                id="otp"
                value={code ?? ""}
                onChange={(e) => setCode(Number(e.target.value))}
                className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
              ></input>
            </>
          ) : (
            <>
              <label htmlFor="phone">Phone number</label>
              <input
                type="number"
                id="phone"
                value={phoneNumber ?? ""}
                onChange={(e) => setPhoneNumber(Number(e.target.value))}
                className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
              ></input>
            </>
          )}

          {isLoadingPhoneLogin ? (
            <div className="w-14 h-14 flex justify-center">
              <LoadingAnimation />
            </div>
          ) : showOtp ? (
            <button
              className="bg-black text-white rounded-xl p-2 cursor-pointer hover:bg-gray-600 duration-300 mt-5 w-full"
              onClick={loginWithOTP}
            >
              Confirm OTP
            </button>
          ) : (
            <button
              className="bg-black text-white rounded-xl p-2 cursor-pointer hover:bg-gray-600 duration-300 mt-5 w-full"
              onClick={getOtp}
            >
              GET OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default authentication;
