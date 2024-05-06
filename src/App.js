
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import Web3 from 'web3';
import IcoContractABI from './MyContractABI.json'; // ICO contract ABI
import TokenABI from './ERC20.json'; // ERC20 token ABI
import './App.css';
import loadingSpinner from './loading-spinner.gif';
import * as buffer from "buffer";
import CustomAlert from './CustomAlert';
import './CustomAlert.css';
import logo from './logo.png';
window.Buffer = buffer.Buffer;

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedToken, setSelectedToken] = useState('usd');
  const [approved, setApproved] = useState(false);
  const [audio, setAudio] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explorerLink, setExplorerLink] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  
  const contractAddresses = {
    usdt: '0x51ED996ec8d5c6F3D3772583cEE1469bD1535698'
  };
  const recipientAddress = '4By4qAmTobfAjDvQoHxorksz6sVknZ3aypwoVPf5XNyf';
  const icoContract = '0xEa1f309761aca404097Ab170dED244D10F06470c';

  const LAMPORTS_PER_SOL = 1000000000;
  
  const solanaRpcUrl = "https://api.devnet.solana.com";

  const connection = new Connection(solanaRpcUrl);
  
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const audioData = await import('./button-click.mp3');
        setAudio(audioData.default);
      } catch (error) {
        console.error('Error loading audio file:', error);
      }
    };
  
    loadAudio();
  }, []);

  const handleButtonClick = async (e) => {
    // Check if the event target exists
    if (e.currentTarget) {
      // Visual effect
      e.currentTarget.classList.add('pressed');

      // Play the sound
      if (audio) {
        const audioElement = new Audio(audio);
        audioElement.currentTime = 0;
        await audioElement.play();
      }

      // Remove the 'pressed' class after a short delay (e.g., 200ms)
      setTimeout(() => {
        if (e.currentTarget) {
          e.currentTarget.classList.remove('pressed');
        }
      }, 200);
    }
  };
  
  const connectWallet = async () => {
    console.log(selectedToken);
    try {
      if (selectedToken === 'sol') {
        console.log('Going to connect with fantom..');
        await connectFantomWallet();
      } else if (selectedToken === 'usdt') {
        console.log('Going to connect with ethereum..');
        await connectMetamaskWallet();
      } else {
        showCustomAlert('Please Select Payment Token First!');
        return;
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };
  
  const connectFantomWallet = async () => {
    console.log('Connecting to Fantom wallet...'); // Add this line for verification
    console.log('Solana object:', window.solana);
    try {
      // Check if the Solana Phantom extension is installed and available
      if (window.solana && window.solana.isPhantom) {
        // Connect to Solana Phantom wallet
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setIsConnected(true);
      } else {
        // Solana Phantom extension not found, display an alert
        showCustomAlert('Solana Phantom wallet extension not found!');
        return;
      }
    } catch (error) {
      // Log any errors that occur during the connection process
      console.error('Error connecting to Fantom wallet:', error);
    }
  };
  
  const connectMetamaskWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(
          IcoContractABI,
          icoContract // ICO contract address
        );
        setContract(contractInstance);
        setIsConnected(true);
        const usdtApproved = await checkApprovalStatus(web3Instance, TokenABI, contractAddresses.usdt);
        setApproved({ usdt: usdtApproved });
        getButtonText();
      } catch (error) {
        console.error('Error connecting to Ethereum wallet:', error);
      }
    } else {
      console.error('Please install a wallet like Metamask.');
    }
  };

  const getDecimalPrecision = async () => {
    if (web3) {
      try {
        const tokenContract = new web3.eth.Contract(TokenABI, contractAddresses.usdt);
        const precision = await tokenContract.methods.decimals().call();
        return parseInt(precision);
      } catch (error) {
        console.error('Error fetching decimal precision:', error);
        return 18; // Default to 18 if unable to fetch precision
      }
    } else {
      console.error('Web3 instance not available.');
      return 18; // Default to 18 if web3 instance is not available
    }
  };
  
  const returnApprovedAmount = async () => {
    if (web3 && contract) {
      const web3Instance = new Web3(window.ethereum); // Recreate Web3 instance
      const userAddress = (await web3.eth.getAccounts())[0];
      const tokenContract = new web3Instance.eth.Contract(TokenABI, contractAddresses.usdt);
      const allowance = await tokenContract.methods.allowance(userAddress, icoContract).call();
      return allowance;
    }
    return 0;
  };

  const checkApprovalStatus = async (web3Instance, tokenABI, tokenAddress) => {
    try {
      const tokenContract = new web3Instance.eth.Contract(tokenABI, tokenAddress);
      const accounts = await web3Instance.eth.getAccounts();
      const userAddress = accounts[0];
      const allowance = await tokenContract.methods.allowance(userAddress, icoContract).call();
      return allowance > 0;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setContract(null);
    setIsConnected(false);
    console.log('Wallet disconnected');
  };

  const handleTokenChange = (e) => {
    setSelectedToken(e.target.value);
    if (e.target.value === 'usdt') {
      setWarningMessage('Do not enter your solana exchange address, you will lose your token.');
    } else {
      setWarningMessage('');
    }
  };

  const handleSolanaAddressChange = (e) => {
    setSolanaAddress(e.target.value);
  };

  const approveToken = async (tokenType) => {
    handleTransactionStart();
    if (web3 && contract) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const userAddress = (await web3.eth.getAccounts())[0];
        const amountToApprove = web3.utils.toWei(inputValue, 'ether');
        const tokenContract = new web3Instance.eth.Contract(TokenABI, contractAddresses[tokenType]);
        const allowance = await tokenContract.methods.allowance(userAddress, icoContract).call();
        if (allowance >= amountToApprove) {
          setApproved({ ...approved, [tokenType]: true });
          getButtonText();
        } else {
          const txHash = await tokenContract.methods.approve(icoContract, amountToApprove).send({
            from: userAddress
          });
          handleTransactionEnd(txHash.transactionHash, 'eth');
          const currentAllowance = await tokenContract.methods.allowance(userAddress, icoContract).call();
          if (currentAllowance > 0) {
            setApproved({ ...approved, [tokenType]: true });
            getButtonText();
            console.log(`${tokenType.toUpperCase()} approved successfully.`);
          } else {
            console.log(`Unable to approvel statuse.`);
          }
        }
      } catch (error) {
        console.error(`Error approving ${tokenType.toUpperCase()}:`, error);
        handleTransactionEnd();
      }
    } else {
      showCustomAlert('Please connect your wallet first.');
      console.error('Please connect your wallet first.');
    }
    handleTransactionEnd();
  };

  const getButtonText = () => {
    if (selectedToken === 'sol') {
      return 'BUY TOKEN';
    } else if (selectedToken === 'usdt') {
      if (approved[selectedToken]) {
        return `BUY TOKEN`;
      } else {
        return 'APPROVE';
      }
    } else return 'SELECT A TOKEN FOR PAYMENT';
  };

  const getRecentBlockhash = async () => {
    const { blockhash } = await connection.getRecentBlockhash();
    return blockhash;
  };
  
  const buyUsingSol = async () => {
    if (!isConnected) {
      console.error('User is not connected to the wallet.');
      return;
    }
    handleTransactionStart();  
    try {
      // Connect to the Solana wallet
      await window.solana.connect();
  
      // Get the user's connected Solana address
      const theFundingAddress = new PublicKey(recipientAddress);
  
      // Retrieve the amount from inputValue and convert it to lamports
      const solAmount = parseFloat(inputValue);
      const lamports = solAmount * LAMPORTS_PER_SOL;
  
      // Get the connected wallet address
      const walletPubkey = new PublicKey(walletAddress.toString());
  
      // Get a recent block hash
      const recentBlockhash = await getRecentBlockhash();
  
      // Create a new transaction with a recent block hash
      const transaction = new Transaction({
        recentBlockhash,
        feePayer: walletPubkey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: theFundingAddress,
          lamports,
        })
      );
  
      // Sign the transaction with the connected wallet
      const signedTransaction = await window.solana.signTransaction(transaction);
  
      // Send the signed transaction
      const transactionHash = await connection.sendRawTransaction(signedTransaction.serialize());
  
      // Wait for the transaction to be confirmed
      await connection.confirmTransaction(transactionHash);
  
      // Log the transaction hash for verification
      console.log('Transaction Hash:', transactionHash);
      handleTransactionEnd(transactionHash, 'sol');
    } catch (error) {
      console.error('Error buying using SOL:', error);
      handleTransactionEnd();
    }
  };

  const buyUsingUsdt = async () => {
    if (approved[selectedToken]) {
      if (web3 && contract) {
        try {
          // Check if the Solana address is empty
          if (!solanaAddress) {
            showCustomAlert('Please enter a Solana address.');
            return;
          }
          const decimal = await getDecimalPrecision();
          const amount = (inputValue * 10 ** decimal).toString();
          const approvedAmount = await returnApprovedAmount();
          // Ensure web3.eth.getAccounts() is awaited properly
          const accounts = await web3.eth.getAccounts();
          const senderAddress = accounts[0];
          const isValidSolanaAddress = PublicKey.isOnCurve(new PublicKey(solanaAddress).toBytes());
          let isValidAmount = false;
          if (amount > 0) {
            isValidAmount = true;
          }
          console.log(decimal, amount, approvedAmount, senderAddress);
          if (!isValidAmount) {
            showCustomAlert('Please enter a valid amount.');
            return;
          }
          if (!isValidSolanaAddress) {
            showCustomAlert('Please enter a valid Solana address.');
            return;
          }
          handleTransactionStart();
          if (approvedAmount >= amount) {
            console.log('Going to buy TOKEN using usdt ERC20.');
            // Updated exchangeToken function call with solanaAddress parameter
            const txHash = await contract.methods.buy(solanaAddress, senderAddress, amount).send({
              from: (await web3.eth.getAccounts())[0]
            });
            console.log(`${selectedToken.toUpperCase()} deposited successfully`);
            handleTransactionEnd(txHash.transactionHash, 'eth');
          } else {
            console.log('Please approve the token first.');
            approveToken(selectedToken);
          }
        } catch (error) {
          console.error(`Error buying TOKEN ${selectedToken.toUpperCase()}:`, error);
          handleTransactionEnd();
        }
      } else {
        showCustomAlert('Please connect your wallet first.');
        console.error('Please connect your wallet first.');
      }
    } else {
      console.log('Please approve the token first.');
      approveToken(selectedToken);
    }
  };

  const buyTOKEN = async () => {
    if (selectedToken === 'sol') {
      await buyUsingSol();
    } else {
      await buyUsingUsdt();
    }
  };

  const showCustomAlert = (message, explorerLink = '') => {
    setAlertMessage(message);
    setExplorerLink(explorerLink);
    setShowAlert(true);
  };

  const closeCustomAlert = () => {
    setShowAlert(false);
  };

  const handleTransactionStart = () => {
    setIsLoading(true);
    console.log(`Transection started..`);
  };

  const handleTransactionEnd = (transactionHash, network) => {
    if (transactionHash) {
      const explorerLink = network === 'sol'
        ? `https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`
        : `https://sepolia.etherscan.io/tx/${transactionHash}`;
  
      showCustomAlert(`Transaction confirmed!`, explorerLink);
    }
    setIsLoading(false);
    console.log(`Transection end..`);
  };

  return (
    <div className='main_back'>
      {warningMessage && <div className="warning-message">{warningMessage}</div>}
      <header>
        <div className="header-left">
          <img src={logo} alt="Logo" className="logo" />
          <h1><b>Demo </b></h1>
        </div>
        <div className="header-right">
          {isConnected ? (
            <button onClick={(e) => { disconnectWallet(); handleButtonClick(e); }}>Disconnect Wallet</button>
          ) : (
            <button onClick={(e) => { connectWallet(); handleButtonClick(e); }}>Connect Wallet</button>
          )}
        </div>
      </header>
      <div className="container">
        <main className='input'>
          <h1 className="ico">Demo ICO</h1>
          <div className="input-container">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter amount.."
            />
            <div className="dropdown">
              <select onChange={handleTokenChange} value={selectedToken}>
                <option className='select_opt' value="usd">SELECT</option>
                <option className='sol_opt' value="sol">SOL (SOLANA)</option>
                <option className='usdt_opt' value="usdt">USDT (ERC20)</option>
              </select>
            </div>
          </div>
          <div className='solAddress'>
            {selectedToken === 'usdt' && (
              <input
                type="text"
                value={solanaAddress}
                onChange={handleSolanaAddressChange}
                placeholder="Enter Solana Address.."
              />
            )}
          </div>
          <div className='but'>
            <button onClick={(e) => { handleButtonClick(e); buyTOKEN(); }}>
              {getButtonText()}
            </button>
          </div>
        </main>
        <footer className="footer">
          <p>&copy; 2024 DemoPage. All rights reserved.</p>
        </footer>
      </div>
      {showAlert && <CustomAlert message={alertMessage} explorerLink={explorerLink} onClose={closeCustomAlert} />}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <img src={loadingSpinner} alt="Loading..." />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;