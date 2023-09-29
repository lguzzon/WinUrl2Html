import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "@rollup/plugin-json";

export default {
  input: "app.cjs", // Replace with the path to your entry file
  output: {
    file: "runMe.cjs", // Replace with the desired output file path
    format: "cjs", // Replace with the desired output format (e.g., 'esm', 'cjs')
  },
  plugins: [resolve(), commonjs(), json()],
};
