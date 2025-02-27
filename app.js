// 🚀 Kết nối ví & Swap VIC/VIN trên Viction

const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let userAddress;

// Địa chỉ hợp đồng & Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
const vinABI = [
    { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
    { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "success", "type": "bool" }], "type": "function" }
];
const swapABI = [
    { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// Kết nối Wallet
async function connectWallet() {
    try {
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        document.getElementById("wallet-address").textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`;
        document.getElementById("connect-interface").style.display = "none";
        document.getElementById("swap-interface").style.display = "block";
        updateBalances();
    } catch (error) {
        console.error("Lỗi kết nối ví:", error);
    }
}

// Ngắt kết nối Wallet
function disconnectWallet() {
    userAddress = null;
    document.getElementById("wallet-address").textContent = "";
    document.getElementById("connect-interface").style.display = "block";
    document.getElementById("swap-interface").style.display = "none";
}

// Lấy số dư VIC & VIN
async function updateBalances() {
    if (!userAddress) return;
    const vicBalance = await provider.getBalance(userAddress);
    const vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
    const vinBalance = await vinTokenContract.balanceOf(userAddress);
    document.getElementById("from-token-info").textContent = `VIC: ${ethers.utils.formatEther(vicBalance)}`;
    document.getElementById("to-token-info").textContent = `VIN: ${ethers.utils.formatUnits(vinBalance, 18)}`;
}

// Swap VIC <-> VIN
async function swapTokens() {
    const fromAmount = document.getElementById("from-amount").value;
    if (!fromAmount || isNaN(fromAmount) || fromAmount <= 0) {
        alert("Vui lòng nhập số lượng hợp lệ!");
        return;
    }

    const swapContract = new ethers.Contract(vinSwapAddress, swapABI, signer);
    const isVicToVin = document.getElementById("from-token-logo").src.includes("vic");
    try {
        if (isVicToVin) {
            const tx = await swapContract.swapVicToVin({ value: ethers.utils.parseEther(fromAmount) });
            await tx.wait();
        } else {
            const vinAmount = ethers.utils.parseUnits(fromAmount, 18);
            const vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, signer);
            await vinTokenContract.approve(vinSwapAddress, vinAmount);
            const tx = await swapContract.swapVinToVic(vinAmount);
            await tx.wait();
        }
        alert("Swap thành công!");
        updateBalances();
    } catch (error) {
        console.error("Lỗi khi swap:", error);
    }
}

// Xử lý nút Max
async function setMaxAmount() {
    const isVicToVin = document.getElementById("from-token-logo").src.includes("vic");
    if (!userAddress) return;
    const balance = isVicToVin ? await provider.getBalance(userAddress) : await new ethers.Contract(vinTokenAddress, vinABI, provider).balanceOf(userAddress);
    document.getElementById("from-amount").value = ethers.utils.formatUnits(balance, isVicToVin ? "ether" : 18);
}

// Đảo chiều swap
function swapDirection() {
    const fromLogo = document.getElementById("from-token-logo");
    const toLogo = document.getElementById("to-token-logo");
    if (fromLogo.src.includes("vic")) {
        fromLogo.src = "vin24.png";
        toLogo.src = "vic24.png";
    } else {
        fromLogo.src = "vic24.png";
        toLogo.src = "vin24.png";
    }
}

// Gắn sự kiện
window.onload = () => {
    document.getElementById("connect-wallet").onclick = connectWallet;
    document.getElementById("disconnect-wallet").onclick = disconnectWallet;
    document.getElementById("swap-now").onclick = swapTokens;
    document.getElementById("max-button").onclick = setMaxAmount;
    document.getElementById("swap-direction").onclick = swapDirection;
};
