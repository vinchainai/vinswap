// 📌 Import thư viện ethers.js để kết nối blockchain
const provider = new ethers.BrowserProvider(window.ethereum);
let signer; // Biến lưu trữ signer khi kết nối ví

// 🌍 Địa chỉ hợp đồng thông minh
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

// 🎯 ABI của hợp đồng VIN Swap
const vinSwapABI = [
    { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// 🎯 ABI của token VIN (chỉ cần hàm balanceOf và approve)
const vinTokenABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
];

// ⏳ Biến lưu trữ trạng thái token (VIC -> VIN hoặc VIN -> VIC)
let swapVicToVin = true;

// 🛠 Kết nối ví và cập nhật UI
async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        document.getElementById("wallet-address").textContent = `Wallet: ${await signer.getAddress()}`;

        // Ẩn giao diện home, hiện giao diện swap
        document.getElementById("connect-interface").style.display = "none";
        document.getElementById("swap-interface").style.display = "block";

        // Cập nhật số dư
        updateBalances();
    } catch (error) {
        alert("Failed to connect wallet!");
        console.error(error);
    }
}

// 🔄 Cập nhật số dư VIC và VIN
async function updateBalances() {
    try {
        const address = await signer.getAddress();
        const balanceVic = await provider.getBalance(address);
        const vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, provider);
        const balanceVin = await vinTokenContract.balanceOf(address);

        document.getElementById("from-token-info").textContent = swapVicToVin 
            ? `VIC: ${ethers.formatEther(balanceVic)}`
            : `VIN: ${ethers.formatUnits(balanceVin, 18)}`;

        document.getElementById("to-token-info").textContent = swapVicToVin 
            ? `VIN: 0.0000`
            : `VIC: 0.0000`;
    } catch (error) {
        console.error("Error updating balances:", error);
    }
}

// 🔄 Xử lý đổi hướng swap (VIC -> VIN hoặc VIN -> VIC)
document.getElementById("swap-direction").addEventListener("click", () => {
    swapVicToVin = !swapVicToVin;
    
    document.getElementById("from-token-logo").src = swapVicToVin ? "vic24.png" : "vin24.png";
    document.getElementById("to-token-logo").src = swapVicToVin ? "vin24.png" : "vic24.png";
    document.getElementById("from-token-info").textContent = swapVicToVin ? "VIC: 0.0000" : "VIN: 0.0000";
    document.getElementById("to-token-info").textContent = swapVicToVin ? "VIN: 0.0000" : "VIC: 0.0000";
    
    updateBalances();
});

// 🔄 Xử lý nút Max (chọn số dư tối đa)
document.getElementById("max-button").addEventListener("click", async () => {
    const address = await signer.getAddress();
    const balanceVic = await provider.getBalance(address);
    const vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, provider);
    const balanceVin = await vinTokenContract.balanceOf(address);
    
    const amount = swapVicToVin ? ethers.formatEther(balanceVic) : ethers.formatUnits(balanceVin, 18);
    document.getElementById("from-amount").value = amount;
    calculateSwapAmount();
});

// 🔄 Tính toán số lượng nhận được sau swap
function calculateSwapAmount() {
    const fromAmount = parseFloat(document.getElementById("from-amount").value);
    if (isNaN(fromAmount) || fromAmount <= 0) {
        document.getElementById("to-amount").value = "0.0";
        return;
    }

    const rate = 100;
    const fee = 0.01;
    const toAmount = swapVicToVin 
        ? (fromAmount / rate) - fee 
        : (fromAmount * rate) - fee;

    document.getElementById("to-amount").value = toAmount.toFixed(4);
}

// 🎯 Xử lý swap khi nhấn nút Swap Now
async function swapNow() {
    try {
        const fromAmount = parseFloat(document.getElementById("from-amount").value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert("Invalid amount!");
            return;
        }

        const vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
        const vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, signer);
        
        if (swapVicToVin) {
            const amountToSwap = ethers.parseEther(fromAmount.toString());
            const tx = await vinSwapContract.swapVicToVin({ value: amountToSwap });
            alert("Transaction submitted! Please wait...");
            await tx.wait();
        } else {
            const amountToSwap = ethers.parseUnits(fromAmount.toString(), 18);
            const approveTx = await vinTokenContract.approve(vinSwapAddress, amountToSwap);
            await approveTx.wait();

            const tx = await vinSwapContract.swapVinToVic(amountToSwap);
            alert("Transaction submitted! Please wait...");
            await tx.wait();
        }

        alert("Swap successful!");
        updateBalances();
    } catch (error) {
        alert("Swap failed!");
        console.error(error);
    }
}

// 🔌 Xử lý ngắt kết nối ví
function disconnectWallet() {
    signer = null;
    document.getElementById("connect-interface").style.display = "block";
    document.getElementById("swap-interface").style.display = "none";
}

// 🎯 Thêm sự kiện cho các nút
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
document.getElementById("swap-now").addEventListener("click", swapNow);
document.getElementById("from-amount").addEventListener("input", calculateSwapAmount);
document.getElementById("disconnect-wallet").addEventListener("click", disconnectWallet);
