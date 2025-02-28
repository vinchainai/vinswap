// 🎯 Cấu hình blockchain
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Hợp đồng Swap VIN/VIC
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Token VIN
const rpcUrl = "https://rpc.viction.xyz"; // RPC mạng Viction

const RATE = 100; // 1 VIN = 100 VIC
const FEE = 0.01; // Phí swap 0.01 VIC
const GAS_FEE_ESTIMATE = 0.000029; // Phí gas ước tính
const MIN_SWAP_AMOUNT_VIC = 0.011; // Số VIC tối thiểu để swap
const MIN_SWAP_AMOUNT_VIN = 0.00011; // Số VIN tối thiểu để swap

// 🌐 ABI hợp đồng
const vinSwapABI = [
    { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const vinABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
];

// 🌐 Khởi tạo provider
const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
let provider, signer, userAddress;

// 🔗 DOM Elements
const connectWalletButton = document.getElementById("connect-wallet");
const disconnectWalletButton = document.getElementById("disconnect-wallet");
const walletAddressDisplay = document.getElementById("wallet-address");
const fromAmountInput = document.getElementById("from-amount");
const toAmountInput = document.getElementById("to-amount");
const fromTokenInfo = document.getElementById("from-token-info");
const toTokenInfo = document.getElementById("to-token-info");
const fromTokenLogo = document.getElementById("from-token-logo");
const toTokenLogo = document.getElementById("to-token-logo");
const swapDirectionButton = document.getElementById("swap-direction");
const maxButton = document.getElementById("max-button");
const swapNowButton = document.getElementById("swap-now");
const transactionFeeDisplay = document.getElementById("transaction-fee");
const gasFeeDisplay = document.getElementById("gas-fee");

let fromToken = "VIC";
let toToken = "VIN";
let balances = { VIC: 0, VIN: 0 };

// 🦊 Kết nối ví MetaMask
connectWalletButton.addEventListener("click", async () => {
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        walletAddressDisplay.textContent = `🟢 ${userAddress}`;
        document.getElementById("connect-interface").style.display = "none";
        document.getElementById("swap-interface").style.display = "block";

        await getBalances();
    } catch (error) {
        console.error("❌ Lỗi khi kết nối ví:", error);
        alert("Không thể kết nối ví. Vui lòng thử lại!");
    }
});

// 🔌 Ngắt kết nối ví
disconnectWalletButton.addEventListener("click", () => {
    document.getElementById("swap-interface").style.display = "none";
    document.getElementById("connect-interface").style.display = "block";
});

// 🔄 Lấy số dư VIC & VIN
async function getBalances() {
    try {
        balances.VIC = parseFloat(ethers.utils.formatEther(await rpcProvider.getBalance(userAddress)));

        const vinContract = new ethers.Contract(vinTokenAddress, vinABI, rpcProvider);
        balances.VIN = parseFloat(ethers.utils.formatUnits(await vinContract.balanceOf(userAddress), 18));

        updateTokenDisplay();
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
    }
}

// 🔄 Cập nhật số dư trên giao diện
function updateTokenDisplay() {
    fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(4)}`;
    toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(4)}`;
}

// 🔄 Xử lý nút "Max"
maxButton.addEventListener("click", () => {
    fromAmountInput.value = balances[fromToken];
    calculateToAmount();
});

// 🔄 Xử lý nút "Mũi tên" (Đảo chiều swap)
swapDirectionButton.addEventListener("click", () => {
    [fromToken, toToken] = [toToken, fromToken];
    [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];

    updateTokenDisplay();
    fromAmountInput.value = "";
    toAmountInput.value = "";
});

// 🔄 Tính số lượng swap
fromAmountInput.addEventListener("input", calculateToAmount);

function calculateToAmount() {
    const fromAmount = parseFloat(fromAmountInput.value);
    if (isNaN(fromAmount) || fromAmount <= 0) {
        toAmountInput.value = "";
        return;
    }

    let receivingAmount;
    if (fromToken === "VIC") {
        receivingAmount = (fromAmount - FEE) / RATE;
    } else {
        receivingAmount = fromAmount * RATE - FEE;
    }

    toAmountInput.value = receivingAmount > 0 ? receivingAmount.toFixed(4) : "0.0000";
}

// 🔄 Xử lý Swap
swapNowButton.addEventListener("click", async () => {
    try {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert("Vui lòng nhập số lượng hợp lệ.");
            return;
        }

        const vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
        const vinContract = new ethers.Contract(vinTokenAddress, vinABI, signer);

        if (fromToken === "VIC") {
            const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());
            const tx = await vinSwapContract.swapVicToVin({ value: fromAmountInWei });
            await tx.wait();
            alert("Swap VIC sang VIN thành công.");
        } else {
            const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);
            const approveTx = await vinContract.approve(vinSwapAddress, fromAmountInWei);
            await approveTx.wait();

            const tx = await vinSwapContract.swapVinToVic(fromAmountInWei);
            await tx.wait();
            alert("Swap VIN sang VIC thành công.");
        }

        await getBalances();
    } catch (error) {
        console.error("❌ Lỗi swap:", error);
        alert(`Swap thất bại: ${error.reason || error.message}`);
    }
});
