// 📌 API Binance lấy giá VIC theo USD
const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/price?symbol=VICUSDT";

// 🏷️ Chọn phần tử HTML để hiển thị giá VIN
const vinPriceElement = document.getElementById("vin-price");

// 🔄 Hàm cập nhật giá VIN theo USD
async function updateVinPrice() {
    try {
        // 🔍 Gọi API lấy giá VIC
        const response = await fetch(BINANCE_API_URL);
        const data = await response.json();

        if (!data || !data.price) {
            throw new Error("Không lấy được giá VIC từ Binance API");
        }

        const vicPrice = parseFloat(data.price); // Giá VIC theo USD
        const vinPrice = (vicPrice * 100).toFixed(2); // 1 VIN = 100 VIC

        // 🔥 Hiển thị giá VIN trên thanh điều hướng
        vinPriceElement.textContent = `1 VIN = ${vinPrice} USD`;
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật giá VIN:", error);
        vinPriceElement.textContent = "Price unavailable";
    }
}

// 🚀 Gọi hàm cập nhật giá ngay khi trang tải
updateVinPrice();

// 🔄 Cập nhật giá mỗi 30 giây
setInterval(updateVinPrice, 30000);
// 🌐 Kết nối với Blockchain Viction (Chain ID 88)
const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer; // Chứa thông tin người dùng (ví)

// 📌 Địa chỉ hợp đồng thông minh VIN Swap & VIN Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

// 🏦 Các biến lưu trữ số dư
let walletAddress = null;
let balances = { VIC: 0, VIN: 0 };

// 📌 ABI của VIN Swap & VIN Token để lấy số dư
const vinSwapABI = [
    { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const vinABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// 🌍 Kết nối hợp đồng
let vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, provider);
let vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

// 🔄 Hàm kết nối ví
async function connectWallet() {
    try {
        // 🦊 Yêu cầu quyền kết nối từ MetaMask
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // 🔌 Kết nối signer
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();

        // 🎉 Hiển thị địa chỉ ví lên giao diện
        document.getElementById("wallet-address").textContent = `Connected: ${walletAddress}`;

        // 🔄 Cập nhật số dư
        await updateBalances();

        // 🎭 Hiển thị giao diện Swap, ẩn giao diện Connect
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';

    } catch (error) {
        console.error("❌ Kết nối ví thất bại:", error);
        alert("⚠️ Failed to connect wallet. Please try again!");
    }
}

// 🔄 Hàm lấy số dư VIC & VIN
async function updateBalances() {
    try {
        // 🏦 Lấy số dư VIC (Native Coin)
        balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));

        // 🏦 Lấy số dư VIN (Token ERC-20)
        const vinBalanceRaw = await vinTokenContract.balanceOf(walletAddress);
        balances.VIN = parseFloat(ethers.utils.formatUnits(vinBalanceRaw, 18));

        // 📌 Hiển thị số dư lên giao diện
        document.getElementById("from-token-info").textContent = `VIC: ${balances.VIC.toFixed(4)}`;
        document.getElementById("to-token-info").textContent = `VIN: ${balances.VIN.toFixed(4)}`;
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
        alert("⚠️ Failed to fetch balances. Please try again!");
    }
}

// 🖱️ Khi bấm "Connect Wallet"
document.getElementById("connect-wallet").addEventListener("click", connectWallet);

// 🔢 Hằng số Swap
const RATE = 100; // 1 VIN = 100 VIC
const FEE = 0.01; // Phí giao dịch 0.01 VIC
const MIN_SWAP_AMOUNT_VIC = 0.011; // Tối thiểu 0.011 VIC
const MIN_SWAP_AMOUNT_VIN = 0.00011; // Tối thiểu 0.00011 VIN

// 🔄 Tính toán số lượng nhận được khi nhập vào
function calculateToAmount() {
    const fromAmount = parseFloat(fromAmountInput.value);
    if (isNaN(fromAmount) || fromAmount <= 0) {
        toAmountInput.value = '';
        return;
    }

    let netFromAmount;
    let toAmount;

    if (fromToken === 'VIC') {
        if (fromAmount < MIN_SWAP_AMOUNT_VIC) {
            alert(`⚠️ Minimum swap amount is ${MIN_SWAP_AMOUNT_VIC} VIC.`);
            return;
        }
        netFromAmount = fromAmount - FEE;
        toAmount = netFromAmount > 0 ? (netFromAmount / RATE).toFixed(4) : '0.0000';
    } else {
        if (fromAmount < MIN_SWAP_AMOUNT_VIN) {
            alert(`⚠️ Minimum swap amount is ${MIN_SWAP_AMOUNT_VIN} VIN.`);
            return;
        }
        netFromAmount = fromAmount * RATE;
        toAmount = netFromAmount > FEE ? (netFromAmount - FEE).toFixed(4) : '0.0000';
    }

    toAmountInput.value = toAmount;
    transactionFeeDisplay.textContent = `Transaction Fee: ${FEE} VIC`;
}

// ⌨️ Khi nhập số lượng, tự động tính toán
fromAmountInput.addEventListener('input', calculateToAmount);

// 🔄 Thực hiện Swap
swapNowButton.addEventListener('click', async () => {
    try {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert('⚠️ Please enter a valid amount to swap.');
            return;
        }

        if (fromToken === 'VIC') {
            const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());

            // 🚀 Gửi giao dịch Swap VIC → VIN
            const tx = await vinSwapContract.connect(signer).swapVicToVin({
                value: fromAmountInWei
            });
            await tx.wait();
            alert('✅ Swap VIC to VIN successful.');
        } else {
            const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);

            // ✅ Phê duyệt hợp đồng Swap
            const approveTx = await vinTokenContract.connect(signer).approve(vinSwapAddress, fromAmountInWei);
            await approveTx.wait();

            // 🚀 Gửi giao dịch Swap VIN → VIC
            const tx = await vinSwapContract.connect(signer).swapVinToVic(fromAmountInWei);
            await tx.wait();
            alert('✅ Swap VIN to VIC successful.');
        }

        // 🔄 Cập nhật lại số dư sau khi swap
        await updateBalances();
    } catch (error) {
        console.error("❌ Swap failed:", error);
        alert(`⚠️ Swap failed: ${error.reason || error.message}`);
    }
});
// 🔘 Nút Max: Chọn tối đa số dư hiện có
maxButton.addEventListener('click', async () => {
    const connected = await ensureWalletConnected();
    if (!connected) return;

    fromAmountInput.value = balances[fromToken];
    calculateToAmount();
});
// 🔄 Hoán đổi Token VIC ⇄ VIN
swapDirectionButton.addEventListener('click', () => {
    [fromToken, toToken] = [toToken, fromToken];
    [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];

    updateTokenDisplay();
    clearInputs();
});

// 🗑️ Xóa dữ liệu nhập khi đổi chiều
function clearInputs() {
    fromAmountInput.value = '';
    toAmountInput.value = '';
}
// 🔌 Ngắt kết nối ví
disconnectWalletButton.addEventListener('click', async () => {
    try {
        if (walletConnectProvider) {
            await walletConnectProvider.disconnect();
            walletConnectProvider = null;
        }

        // 🔄 Reset lại toàn bộ dữ liệu liên quan đến ví
        walletAddress = null;
        balances = { VIC: 0, VIN: 0 };
        vinSwapContract = null;
        vinTokenContract = null;

        // 🗑️ Xóa thông tin UI
        walletAddressDisplay.textContent = '';
        clearInputs();
        showConnectInterface();

        alert('✅ Wallet disconnected successfully.');
    } catch (error) {
        console.error('❌ Error disconnecting wallet:', error);
        alert('⚠️ Failed to disconnect wallet. Please try again.');
    }
});

// 🎭 Chuyển đổi giữa giao diện "Connect Wallet" và "Swap"
function showSwapInterface() {
    document.getElementById('swap-interface').style.display = 'block';
    document.getElementById('connect-interface').style.display = 'none';
}

function showConnectInterface() {
    document.getElementById('swap-interface').style.display = 'none';
    document.getElementById('connect-interface').style.display = 'block';
}
