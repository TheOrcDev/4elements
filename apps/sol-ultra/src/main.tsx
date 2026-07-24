import { createRoot } from "react-dom/client";
import ElementalExperience from "./ElementalExperience";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The root element was not found.");
}

createRoot(root).render(<ElementalExperience />);
