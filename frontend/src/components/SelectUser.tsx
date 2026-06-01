import './styles/SelectUser.css'
import Select from 'react-select';
import AvatarPicker from './AvatarPicker';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

class User {
    private static lastId = 0;
    id: string;
    name: string;
    avatar: string;

    constructor(name: string, avatar: string) {
        User.lastId += 1;
        this.id = crypto.randomUUID();
        this.name = name;
        this.avatar = avatar;
    }
}

function SelectUser() {
    interface UserFormat {
        value: string,
        label: string,
        image: string;
    }

    const formatOptionLabel = ({ label, image }: UserFormat) => (
        <div className="flex items-center gap-3 py-0.5">
            <img src={image} className="w-7 h-7 rounded-full object-cover border border-gray-100" alt={label} />
            <span className="font-medium text-gray-700">{label}</span>
        </div>
    );

    const { setCurrentUser } = useAuth()

    const navigate = useNavigate();

    const [name, setName] = useState<string>("");
    const [selectedAvatar, setSelectedAvatar] = useState<string>(null!);

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5000/api/users");
                if (!response.ok) {
                    console.error("Failed to load users from CSV");
                    return;
                }

                const usersFromCsv = await response.json();
                setUsers(usersFromCsv);
            } catch (error) {
                console.error("Error loading users:", error);
            }
        };

        loadUsers();
    }, []);

    const handleCreate = async () => {
        const newUser = new User(name, selectedAvatar);
        
        try {
            const response = await fetch("http://127.0.0.1:5000/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newUser.id,
                    name: newUser.name,
                    avatar: newUser.avatar
                })
            });
            
            if (!response.ok) {
                console.error("Failed to save user to CSV");
                return;
            }
        } catch (error) {
            console.error("Error saving user:", error);
            return;
        }
        
        setUsers([...users, newUser]);
        setName("");
        setSelectedAvatar(null!)
    }

    const options = useMemo(() => {
        return users.map((user) => ({
            value: user.id,
            label: user.name,
            image: user.avatar,
        }));
    }, [users]);


    const [selectedUser, setSelectedUser] = useState<User>();
    

    return (
        <div className='h-full w-full bg-slate-50 flex flex-col items-center justify-center p-6 antialiased'>
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Who's watching?</h1>
                <p className="text-gray-500 mt-2 text-sm">Select an existing profile or create a new one to get started.</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl w-full bg-white rounded-2xl border border-gray-100 p-8 md:p-12 shadow-sm'>
                
                <div className='flex flex-col justify-between space-y-6 border-b border-gray-100 pb-10 md:border-b-0 md:border-r md:border-gray-100 md:pb-0 md:pr-12'>
                    <div>
                        <h2 className='text-xl font-semibold text-gray-800 tracking-tight mb-1'>Choose Profile</h2>
                        <p className='text-xs text-gray-400 mb-6'>Pick from previously created accounts.</p>
                        
                        <div className="w-full">
                            <Select 
                                options={options} 
                                formatOptionLabel={formatOptionLabel}
                                unstyled
                                placeholder="Search or select user..."
                                isSearchable={false}
                                onChange={(option) => {
                                    if (option) {
                                        const user = users.find(u => u.id === option.value);
                                        if (user) setSelectedUser(user);
                                    }
                                }}
                                classNames={{
                                    control: ({ isFocused }) =>
                                    `flex border rounded-xl transition-all py-2.5 px-4 w-full bg-gray-50/50 cursor-pointer ${
                                        isFocused ? 'border-teal-600 ring-2 ring-teal-600/10' : 'border-gray-200 hover:border-gray-300'
                                    }`,
                                    placeholder: () => 'text-gray-400 text-sm',
                                    menu: () => 'mt-2 border border-gray-100 bg-white rounded-xl shadow-xl overflow-hidden p-1',
                                    option: ({ isFocused, isSelected }) =>
                                    `p-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                                        isSelected ? 'bg-teal-600 text-white' : isFocused ? 'bg-teal-50 text-gray-900' : 'text-gray-700'
                                    }`,
                                    noOptionsMessage: () => 'p-3 text-sm text-gray-400 text-center',
                                }}
                                styles={{
                                    control: (base) => ({ ...base, cursor: 'pointer' }),
                                    option: (base) => ({ ...base, cursor: 'pointer' }),
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (selectedUser) {
                                setCurrentUser(selectedUser)
                                navigate(`${selectedUser.id}`);
                            }
                        }}
                        className='w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium 
                        rounded-xl transition-colors shadow-sm shadow-teal-600/10 cursor-pointer 
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-600'
                        disabled={!selectedUser}>
                        Enter MovieHub
                    </button>
                </div>

                <div className='flex flex-col justify-between space-y-6 pt-2 md:pt-0'>
                    <div className="space-y-5">
                        <div>
                            <h2 className='text-xl font-semibold text-gray-800 tracking-tight mb-1'>New Profile</h2>
                            <p className='text-xs text-gray-400 mb-6'>Add a new space to save personalized lists.</p>
                        </div>
                        
                        <div className='flex flex-col gap-2'>
                            <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Profile Name</label>
                            <input 
                                value={name}
                                onChange={(e) => {setName(e.target.value)}}
                                className="border bg-gray-50/50 rounded-xl w-full py-2.5 px-4 text-sm transition-all focus:outline-none 
                                border-gray-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 hover:border-gray-300
                                placeholder:text-gray-400"       
                                type="text" 
                                placeholder='e.g. John Doe'
                            />
                        </div>

                        <div className='flex flex-col gap-2'>
                            <label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Select Avatar</label>
                            <AvatarPicker selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} />
                        </div>
                    </div>

                    <button 
                        onClick={() => handleCreate()}
                        className='w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium 
                        rounded-xl transition-colors shadow-sm shadow-emerald-600/10 cursor-pointer 
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600'
                        disabled={!name || !selectedAvatar}>
                            Create Profile
                    </button>
                </div>
            </div>
        </div>
    ) 
}

export default SelectUser;