import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// motion.create di level modul agar tidak membuat komponen baru tiap render.
const MotionLink = motion.create(Link);

export default MotionLink;
