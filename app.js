document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const fromTokenLogo = document.getElementById('from-token-logo');
    const toTokenLogo = document.getElementById('to-token-logo');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');

    // Blockchain Config
    let provider, signer;
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee
    const GAS_FEE_ESTIMATE = 0.000029; // Estimated gas fee
    const MIN_SWAP_AMOUNT_VIC = 0.011; // Minimum VIC
    const MIN_SWAP_AMOUNT_VIN = 0.00011; // Minimum VIN

    const vinSwapABI = [
        {
            "inputs": [],
            "name": "swapVicToVin",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }],
            "name": "swapVinToVic",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const vinABI = [
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "spender", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    let vinSwapContract, vinTokenContract;
    let walletAddress = null;
    let balances = { VIC: 0, VIN: 0 };
    let fromToken = 'VIC';
    let toToken = 'VIN';
    // Ensure Wallet Connected
    async function ensureWalletConnected() {
        try {
            if (!window.ethereum) {
                alert('MetaMask is not installed. Please install MetaMask to use this application.');
                return false;
            }

            await window.ethereum.request({ method: "eth_requestAccounts" });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            return true;
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    // Fetch Balances
    async function updateBalances() {
        try {
            balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.VIN = parseFloat(
                ethers.utils.formatUnits(
                    await vinTokenContract.balanceOf(walletAddress),
                    18
                )
            );

            updateTokenDisplay();
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    }

    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(18)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(18)}`;
    }
