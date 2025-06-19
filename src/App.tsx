import "./App.css";
import Authentication from "./pages/authentication";
import CRUD from "./pages/crud";
import Functions from "./pages/functions";
import Realtime from "./pages/realtime";
import Storage from "./pages/storage";

function App() {
  return (
    <main className="h-screen w-full p-10 overflow-y-scroll">
      <h1 className="font-bold text-4xl text-center">FIREBASE</h1>
      <div className="flex flex-col gap-1">
        <Authentication />
        <CRUD />
        <Storage />
        <Realtime />
        <Functions />
      </div>
    </main>
  );
}

export default App;
