import React, { useState, useEffect, useCallback } from 'react';
import { VideoCameraIcon, UsersIcon, WalletIcon, GiftIcon, CheckCircleIcon, LoadingSpinner, PencilSquareIcon, ArrowUpTrayIcon, SparklesIcon, ArrowDownTrayIcon, ArrowPathIcon, InformationCircleIcon } from './components/Icons';
import { editImageWithPrompt } from './services/geminiService';


type Tab = 'watch' | 'edit' | 'refer' | 'withdraw';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('watch');
  const [credits, setCredits] = useState<number>(125.50);

  const renderContent = () => {
    switch (activeTab) {
      case 'watch':
        return <WatchView onCreditsEarned={(amount) => setCredits(prev => prev + amount)} />;
      case 'edit':
        return <EditImageView />;
      case 'refer':
        return <ReferView />;
      case 'withdraw':
        return <WithdrawView currentBalance={credits} onWithdraw={(amount) => setCredits(prev => prev - amount)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="w-full text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
              ViewInsta
            </h1>
          </div>
          <p className="text-lg text-gray-400">Watch. Earn. Withdraw.</p>
        </header>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur-sm mb-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-lg text-gray-300 mb-2 sm:mb-0">Your Balance</p>
            <div className="flex items-center gap-2 text-3xl font-bold text-sky-400">
                <WalletIcon className="w-8 h-8"/>
                <span>{credits.toFixed(2)}</span>
                <span className="text-xl text-gray-400 font-medium">credits</span>
            </div>
        </div>
        
        <main className="w-full bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm">
          <nav className="flex border-b border-gray-700">
            <TabButton icon={<VideoCameraIcon />} text="Watch Video" isActive={activeTab === 'watch'} onClick={() => setActiveTab('watch')} />
            <TabButton icon={<PencilSquareIcon />} text="Edit Image" isActive={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
            <TabButton icon={<UsersIcon />} text="Refer & Earn" isActive={activeTab === 'refer'} onClick={() => setActiveTab('refer')} />
            <TabButton icon={<WalletIcon />} text="Withdraw" isActive={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} />
          </nav>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

interface TabButtonProps {
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, text, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors duration-300 focus:outline-none ${
            isActive 
            ? 'bg-sky-500/10 text-sky-400 border-b-2 border-sky-400' 
            : 'text-gray-400 hover:bg-gray-700/50'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <div className="w-6 h-6">{icon}</div>
        <span className="hidden sm:inline">{text}</span>
    </button>
)

const WatchView: React.FC<{onCreditsEarned: (amount: number) => void}> = ({ onCreditsEarned }) => {
    const videoDuration = 15; // seconds
    const creditsPerVideo = 10;
    const [timeRemaining, setTimeRemaining] = useState(videoDuration);
    const [isWatched, setIsWatched] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsWatched(true);
        }
    }, [timeRemaining]);

    const handleClaim = () => {
        setIsClaiming(true);
        setTimeout(() => {
            onCreditsEarned(creditsPerVideo);
            resetWatcher();
            setIsClaiming(false);
        }, 1500);
    }
    
    const resetWatcher = () => {
        setTimeRemaining(videoDuration);
        setIsWatched(false);
    }

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Watch this video to earn credits!</h2>
            <div className="w-full aspect-video bg-black rounded-lg mb-4 border border-gray-700 overflow-hidden">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${((videoDuration - timeRemaining) / videoDuration) * 100}%` }}></div>
            </div>
            <button
                onClick={handleClaim}
                disabled={!isWatched || isClaiming}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
                {isClaiming ? <><LoadingSpinner className="w-5 h-5"/> Claiming...</> : `Claim ${creditsPerVideo} Credits`}
            </button>
        </div>
    )
}

const EditImageView: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ data: string; mimeType: string; url: string } | null>(null);
    const [prompt, setPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64String = dataUrl.split(',')[1];
                setOriginalImage({ data: base64String, mimeType: file.type, url: dataUrl });
                setEditedImage(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!originalImage || !prompt.trim()) {
            setError('Please select an image and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const result = await editImageWithPrompt(originalImage.data, originalImage.mimeType, prompt);
            setEditedImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setOriginalImage(null);
        setEditedImage(null);
        setPrompt('');
        setError(null);
        setIsLoading(false);
    };

    const handleSave = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${editedImage}`;
        link.download = 'edited-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <LoadingSpinner className="w-12 h-12 text-sky-400" />
                <h2 className="text-xl font-semibold mt-4 text-gray-300">Gemini is working its magic...</h2>
                <p className="text-gray-400">Editing your image, please wait.</p>
            </div>
        );
    }
    
    if (editedImage && originalImage) {
        return (
            <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">Edit Successful!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-center mb-2">Original</h3>
                        <img src={originalImage.url} alt="Original" className="rounded-lg w-full h-auto object-contain" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-center mb-2">Edited</h3>
                        <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="rounded-lg w-full h-auto object-contain" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-all">
                        <ArrowDownTrayIcon className="w-5 h-5" /> Save Image
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-2 bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-700 transition-all">
                        <ArrowPathIcon className="w-5 h-5" /> Start Over
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Edit Image with AI</h2>
            {!originalImage ? (
                <div className="relative w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-sky-500 hover:text-sky-400 transition-colors cursor-pointer">
                    <ArrowUpTrayIcon className="w-12 h-12 mb-2" />
                    <span className="font-semibold">Click to upload an image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute w-full h-full opacity-0 cursor-pointer" />
                </div>
            ) : (
                <div className="mb-4">
                    <img src={originalImage.url} alt="Selected preview" className="max-h-72 w-auto mx-auto rounded-lg" />
                </div>
            )}
            
            <div className="my-4">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe your edit</label>
                <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Add a retro filter, change background to a beach"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    disabled={!originalImage}
                />
            </div>
            
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            
            <button
                onClick={handleGenerate}
                disabled={!originalImage || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            >
                <SparklesIcon className="w-5 h-5" /> Generate
            </button>
        </div>
    );
};


const ReferView: React.FC = () => {
    const referralLink = "https://viewinsta.example/ref/user123";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="text-center">
            <GiftIcon className="w-16 h-16 mx-auto text-sky-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invite Friends, Earn More!</h2>
            <p className="text-gray-400 mb-6">Earn 50 credits for every friend who signs up and watches their first video.</p>
            <div className="bg-gray-900/50 border border-dashed border-gray-600 rounded-lg p-4 mb-4">
                <p className="text-gray-300 font-mono break-words">{referralLink}</p>
            </div>
            <button
                onClick={handleCopy}
                className="w-full sm:w-auto bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-all duration-300"
            >
                {copied ? 'Copied to Clipboard!' : 'Copy Referral Link'}
            </button>
        </div>
    )
}

const WithdrawView: React.FC<{currentBalance: number, onWithdraw: (amount: number) => void}> = ({ currentBalance, onWithdraw }) => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    
    const processingFee = 2.50;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (numAmount + processingFee > currentBalance) {
            setError('Withdrawal amount plus fee cannot exceed your balance.');
            return;
        }
        if (numAmount < 100) {
            setError('Minimum withdrawal amount is 100 credits.');
            return;
        }
        
        setStep('confirm');
    }

    const handleConfirm = () => {
        const numAmount = parseFloat(amount);
        const totalDeducted = numAmount + processingFee;
        onWithdraw(totalDeducted);
        setStep('success');
        setAmount('');
    }

    if (step === 'success') {
        return (
            <div className="text-center">
                <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Withdrawal Successful!</h2>
                <p className="text-gray-400 mb-6">Your request has been processed. It may take 3-5 business days.</p>
                <button onClick={() => setStep('form')} className="bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-700">
                    Make another withdrawal
                </button>
            </div>
        )
    }

    if (step === 'confirm') {
        const numAmount = parseFloat(amount);
        const totalDeducted = numAmount + processingFee;
        return (
            <div className="text-center">
                <InformationCircleIcon className="w-16 h-16 mx-auto text-sky-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Confirm Your Withdrawal</h2>
                <p className="text-gray-400 mb-6">Please review the details below before confirming.</p>
                
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6 text-left space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Withdrawal Amount:</span>
                        <span className="font-semibold text-white">{numAmount.toFixed(2)} credits</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Processing Fee:</span>
                        <span className="font-semibold text-white">{processingFee.toFixed(2)} credits</span>
                    </div>
                    <div className="border-t border-gray-600 my-2"></div>
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-300 font-bold">Total to Deduct:</span>
                        <span className="font-bold text-sky-400">{totalDeducted.toFixed(2)} credits</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button onClick={() => setStep('form')} className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-all">
                        Confirm Withdrawal
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">Amount (min. 100 credits)</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 500"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <WalletIcon className="w-5 h-5 text-gray-400"/>
                        </div>
                    </div>
                </div>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 disabled:bg-gray-600 transition-all duration-300"
                >
                    Request Withdrawal
                </button>
            </form>
        </div>
    )
}

export default App;