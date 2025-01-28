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
    const gasFeeDisplay = document.getElementById('gas-fee');
    const vinToUsdDisplay = document.getElementById('vin-to-usd');

    // Blockchain Config
    let provider, signer;
    const vinSwapAddress = "0xC23a850B5a09ca99d94f80DA08586f2d85320e94";
    const vinTokenAddress = "0xeD9b4820cF465cc32a842434d6AeC74E950976c7";
    const RATE = 0.039; // 1 VIN = 0.039 BNB
    const vinSwapABI = [
        {
            "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }],
            "name": "swapVINForBNB",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "swapBNBForVIN",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ];

    const vinTokenABI = [
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
    let balances = { VIN: 0, BNB: 0 };
    let fromToken = 'VIN';
    let toToken = 'BNB';
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

    // Fetch BNB/USD price from BSC API
    async function fetchBnbToUsdPrice() {
        try {
            const response = await fetch(
                `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=BIEGUCY7A9NPF2M2KPYZRMRFABVCVJ9D3V`
            );
            const data = await response.json();
            return parseFloat(data.result.ethusd); // Giá BNB/USD từ API
        } catch (error) {
            console.error("Failed to fetch BNB price:", error);
            return null;
        }
    }

    // Calculate VIN/USD price
    async function calculateVinPrice() {
        try {
            const bnbToUsd = await fetchBnbToUsdPrice();
            if (!bnbToUsd) return;

            const vinToUsd = (RATE * bnbToUsd).toFixed(2); // Tính giá VIN/USD
            vinToUsdDisplay.textContent = vinToUsd; // Cập nhật giá trên giao diện
        } catch (error) {
            console.error("Failed to calculate VIN price:", error);
        }
    }
    // Fetch Balances
    async function updateBalances() {
        try {
            balances.BNB = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
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

    // Update Token Display
    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(4)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(4)}`;
    }

    // Max Button
    maxButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        fromAmountInput.value = balances[fromToken];
        calculateToAmount();
    });

    // Calculate To Amount
    fromAmountInput.addEventListener('input', calculateToAmount);
    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = '';
            return;
        }

        let toAmount;
        if (fromToken === 'VIN') {
            toAmount = (fromAmount * RATE).toFixed(4);
        } else {
            toAmount = (fromAmount / RATE).toFixed(4);
        }

        toAmountInput.value = toAmount;
        gasFeeDisplay.textContent = `Estimated Gas Fee: ~0.0005 BNB`;
    }
    // Swap Direction
    swapDirectionButton.addEventListener('click', () => {
        [fromToken, toToken] = [toToken, fromToken];
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];
        updateTokenDisplay();
        clearInputs();
    });

    // Clear Inputs
    function clearInputs() {
        fromAmountInput.value = '';
        toAmountInput.value = '';
    }

    // Swap Tokens
    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);

            if (isNaN(fromAmount) || fromAmount <= 0) {
                alert('Please enter a valid amount to swap.');
                return;
            }

            if (fromToken === 'VIN') {
                const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);

                const approveTx = await vinTokenContract.approve(vinSwapAddress, fromAmountInWei);
                await approveTx.wait();

                const tx = await vinSwapContract.swapVINForBNB(fromAmountInWei);
                await tx.wait();
                alert('Swap VIN to BNB successful.');
            } else {
                const tx = await vinSwapContract.swapBNBForVIN({ value: ethers.utils.parseEther(fromAmount.toString()) });
                await tx.wait();
                alert('Swap BNB to VIN successful.');
            }

            await updateBalances();
        } catch (error) {
            console.error("Swap failed:", error);
            alert(`Swap failed: ${error.reason || error.message}`);
        }
    });
    // Connect Wallet
    connectWalletButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        try {
            vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, signer);

            walletAddressDisplay.textContent = walletAddress;
            await updateBalances();
            calculateVinPrice(); // Cập nhật giá VIN/USD khi kết nối ví
            showSwapInterface();
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            alert(`Failed to initialize wallet: ${error.message}`);
        }
    });

    // Disconnect Wallet
    disconnectWalletButton.addEventListener('click', async () => {
        walletAddress = null;
        balances = { VIN: 0, BNB: 0 };
        vinSwapContract = null;
        vinTokenContract = null;

        walletAddressDisplay.textContent = '';
        clearInputs();
        showConnectInterface();

        alert('Wallet disconnected successfully.');
    });

    // Show/Hide Interfaces
    function showSwapInterface() {
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';
    }

    function showConnectInterface() {
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';
    }

    // Initialize Interface
    showConnectInterface();
});
