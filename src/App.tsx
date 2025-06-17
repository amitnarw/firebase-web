import "./App.css";
import Authentication from "./pages/Authentication";
import CRUD from "./pages/CRUD";
import Storage from "./pages/Storage";

function App() {
  return (
    <main className="h-screen w-full p-10 overflow-y-scroll">
      <h1 className="font-bold text-4xl text-center">FIREBASE</h1>
      <div className="flex flex-col gap-1">
        <Authentication />
        <CRUD />
        <Storage />
      </div>
    </main>
  );
}

export default App;
