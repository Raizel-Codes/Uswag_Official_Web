import avatar1 from "@/assets/images/avatars/officer-avatar-1.svg";
import avatar2 from "@/assets/images/avatars/officer-avatar-2.svg";
import avatar3 from "@/assets/images/avatars/officer-avatar-3.svg";
import avatar4 from "@/assets/images/avatars/officer-avatar-4.svg";
import avatar5 from "@/assets/images/avatars/officer-avatar-5.svg";
import avatar6 from "@/assets/images/avatars/officer-avatar-6.svg";

// Cute chibi-student illustration set, styled after the org's mist/primary/forest
// palette. Used as a placeholder face for the officer roster until real
// officer photos are uploaded — never meant to represent a real person.
const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];

/** Deterministic pick so the same officer always gets the same illustration. */
function pickAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length];
}

interface OfficerAvatarProps {
  seed: string;
  className?: string;
}

export default function OfficerAvatar({ seed, className = "" }: OfficerAvatarProps) {
  return (
    <img
      src={pickAvatar(seed)}
      alt=""
      aria-hidden="true"
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
