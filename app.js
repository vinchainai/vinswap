// ==============================
// 🔹 KẾT NỐI VÍ & CẬP NHẬT SỐ DƯ VIC & VIN
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    // Lấy các phần tử quan trọng từ giao diện
    const connectWalletBtn = document.getElementById("connect-wallet");
    const disconnectWalletBtn = document.getElementById("disconnect-wallet");
    const swapInterface = document.getElementById("swap-interface");
    const walletAddressEl = document.getElementById("wallet-address");
    const fromBalance = document.getElementById("from-balance");
    const toBalance = document.getElementById("to-balance");

    let provider, signer, walletAddress;
    let vinTokenContract;
    
    // Địa chỉ hợp đồng thông minh của VIN & Swap Contract
    const VIN_CONTRACT_ADDRESS = "0xeD9b4820cF465cc32a842434d6AeC74E950976c7";
    const SWAP_CONTRACT_ADDRESS = "0xC23a850B5a09ca99d94f80DA08586f2d85320e94";

    // ABI của VIN Token (Chỉ lấy phần cần thiết)
    const vinABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    // 📌 Kết nối ví
    async function connectWallet() {
        if (!window.ethereum) {
            alert("❌ Please install MetaMask or use a Web3 browser!");
            return;
        }

        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            console.log("🔗 Wallet connected:", walletAddress);

            vinTokenContract = new ethers.Contract(VIN_CONTRACT_ADDRESS, vinABI, provider);
            await updateBalances();

            // Hiển thị giao diện Swap, ẩn trang chính
            document.querySelector(".main-content").style.display = "none";
            swapInterface.classList.remove("hidden");
            swapInterface.style.display = "block";
            walletAddressEl.textContent = walletAddress;
        } catch (error) {
            console.error("❌ Wallet connection error:", error);
            alert("❌ Unable to connect wallet. Please try again!");
        }
    }

    // 📌 Xử lý khi người dùng bấm "Connect Wallet"
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener("click", connectWallet);
    }

    // 📌 Xử lý khi người dùng bấm "Disconnect Wallet"
    disconnectWalletBtn.addEventListener("click", function () {
        swapInterface.style.display = "none";
        document.querySelector(".main-content").style.display = "flex";
        walletAddressEl.textContent = "Not Connected";
        console.log("🔴 Wallet disconnected.");
        alert("❌ Wallet disconnected!");
    });
});
// ==============================
// 🔹 CẬP NHẬT SỐ DƯ VIC & VIN
// ==============================
async function updateBalances() {
    if (!walletAddress || !provider) return;

    try {
        // Lấy số dư VIC (BNB Native)
        const vicBalance = await provider.getBalance(walletAddress);
        const vinBalance = await vinTokenContract.balanceOf(walletAddress);

        // Chuyển đổi số dư thành định dạng đọc được
        fromBalance.textContent = parseFloat(ethers.utils.formatEther(vicBalance)).toFixed(4);
        toBalance.textContent = parseFloat(ethers.utils.formatUnits(vinBalance, 18)).toFixed(4);

        console.log("✅ Balances updated:", {
            VIC: fromBalance.textContent,
            VIN: toBalance.textContent,
        });
    } catch (error) {
        console.error("❌ Error updating balances:", error);
    }
}

// 📌 Tự động cập nhật số dư mỗi 30 giây
setInterval(updateBalances, 30000);
