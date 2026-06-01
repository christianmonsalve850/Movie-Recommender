import deer from '../assets/deer.png'
import beaver from '../assets/beaver.png'
import cat from '../assets/cat.png'
import chicken from '../assets/chicken.png'
import dog from '../assets/dog.png'
import lion from '../assets/lion.png'
import meerkat from '../assets/meerkat.png'
import panda from '../assets/panda.png'
import rabbit from '../assets/rabbit.png'
import shark from '../assets/shark.png'

const avatars = [
    { id: 'deer', url: deer, label: 'Deer' },
    { id: 'beaver', url: beaver, label: 'beaver' },
    { id: 'cat', url: cat, label: 'cat' },
    { id: 'chicken', url: chicken, label: 'chicken' },
    { id: 'dog', url: dog, label: 'dog' },
    { id: 'lion', url: lion, label: 'lion' },
    { id: 'meerkat', url: meerkat, label: 'meerkat' },
    { id: 'panda', url: panda, label: 'panda' },
    { id: 'rabbit', url: rabbit, label: 'rabbit' },
    { id: 'shark', url: shark, label: 'shark' },
];

interface AvatarProps {
  selectedAvatar: string;
  setSelectedAvatar: React.Dispatch<React.SetStateAction<string>>;
}


const AvatarPicker = ({selectedAvatar, setSelectedAvatar}: AvatarProps) => {

  return (
    <div className="flex w-full items-center ">
        <div className="py-2 px-2 min-2-0 flex overflow-x-auto gap-4 overflow-y-hidden flex-nowrap">
            
            {avatars.map((avatar) => (
                <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`transition-all hover:scale-110 shrink-0`}
                >
                    <img 
                        src={avatar.url}
                        alt={avatar.label}
                        className={`w-12 h-12 object-contain grayscale cursor-pointer hover:grayscale-0 transition-all duration-300 ${selectedAvatar === avatar.url ? 'grayscale-0' : 'grayscale'}`}
                    />
                </button>
            ))}
        </div>
    </div>
  );
};

export default AvatarPicker;