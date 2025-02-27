// 🌐 Khởi tạo provider kết nối với mạng blockchain Viction
let provider = new ethers.providers.Web3Provider(window.ethereum);
let signer; // Đối tượng signer để giao dịch

// 📌 Địa chỉ hợp đồng thông minh VIN Swap & VIN Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

// 🏦 Biến lưu số dư
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

// 🌍 Kết nối hợp đồng thông minh
let vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, provider);
let vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

// 🔄 Kết nối ví MetaMask
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert("🦊 MetaMask chưa được cài đặt. Vui lòng cài đặt MetaMask để sử dụng.");
            return;
        }

        // 🔌 Yêu cầu quyền kết nối từ MetaMask
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Kết nối với ví
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();

        // 🎉 Hiển thị địa chỉ ví lên giao diện
        document.getElementById("wallet-address").textContent = `Connected: ${walletAddress}`;

        // 🔄 Cập nhật số dư
        await updateBalances();

        // Ẩn giao diện kết nối, hiển thị giao diện Swap
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';

    } catch (error) {
        console.error("❌ Kết nối ví thất bại:", error);
        alert("⚠️ Failed to connect wallet. Please try again!");
    }
}

// 🔄 Lấy số dư VIC & VIN
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

// 🖱️ Khi bấm "Connect Wallet", gọi hàm connectWallet()
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
