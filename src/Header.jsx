import { BsFillPersonVcardFill } from "react-icons/bs";
export default function Header() {
  return (
    <header>
      <BsFillPersonVcardFill />
      <span className="title">VCard QR Generator</span>
      <span className="version">v 1.0</span>
    </header>
  );
}
