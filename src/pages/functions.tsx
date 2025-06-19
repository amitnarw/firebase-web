const Functions = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="underline font-medium">Functions</p>
      <div className="flex flex-row gap-5">
        <div className="border border-gray-300 rounded-xl p-4 flex flex-col gap-1">
          <p className="text-purple-500">All Functions</p>
          <p>
            Can only manage functions from function folder of the emulator,
            inside index.ts file
          </p>
          <a
            href="http://localhost:5001/demo-test/us-central1/helloWorld"
            target="_blank"
            className="text-blue-500 underline"
          >
            1. helloWorld
          </a>
          <a
            href="http://localhost:5001/demo-test/us-central1/testFunction"
            target="_blank"
            className="text-blue-500 underline"
          >
            2. testFunction
          </a>
        </div>
      </div>
    </div>
  );
};

export default Functions;
