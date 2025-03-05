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

// ==============================
// 🔹 XỬ LÝ HOÁN ĐỔI CHIỀU SWAP (NÚT MŨI TÊN)
// ==============================

const swapDirectionButton = document.getElementById("swap-direction");
const fromTokenSymbol = document.getElementById("from-token-symbol");
const toTokenSymbol = document.getElementById("to-token-symbol");
const fromTokenLogo = document.getElementById("from-token-logo");
const toTokenLogo = document.getElementById("to-token-logo");

let fromToken = "VIC";
let toToken = "VIN";

// 📌 Xử lý khi bấm nút đảo chiều swap
swapDirectionButton.addEventListener("click", async () => {
    console.log("🔄 Đảo hướng swap...");

    // Đảo vị trí token
    [fromToken, toToken] = [toToken, fromToken];

    // Cập nhật giao diện
    fromTokenSymbol.textContent = fromToken;
    toTokenSymbol.textContent = toToken;

    // Đảo vị trí logo token
    [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];

    // Cập nhật số dư mới sau khi đổi chiều swap
    await updateBalances();
});

// 🚀 Tự động kết nối nếu trước đó đã kết nối
document.addEventListener("DOMContentLoaded", async () => {
    if (window.ethereum && (await window.ethereum.request({ method: "eth_accounts" })).length > 0) {
        await connectWallet();
    }
});

// ==============================
// 🔹 XỬ LÝ KHI NGƯỜI DÙNG NHẬP SỐ LƯỢNG HOẶC BẤM NÚT MAX
// ==============================

// Lấy các phần tử nhập số lượng token
const fromAmountInput = document.getElementById("from-amount");
const toAmountInput = document.getElementById("to-amount");
const maxButton = document.getElementById("max-button");

// ✅ Hàm cập nhật số token nhận được dựa vào tỷ lệ swap
function updateSwapOutput() {
    let fromTokenSymbol = document.getElementById("from-token-symbol").textContent.trim(); // Token nguồn
    let inputAmount = parseFloat(fromAmountInput.value) || 0; // Số lượng token đầu vào
    let outputAmount = 0; // Số lượng token nhận được

    // ✅ Tính số lượng token nhận theo hợp đồng (1 VIN = 100 VIC, trừ phí 0.01 VIC)
    if (fromTokenSymbol === "VIC") {
        let netVic = inputAmount - 0.01; // Trừ phí swap
        outputAmount = netVic >= 0.001 ? netVic / 100 : 0; // Đảm bảo không tính nếu < 0.001 VIN
    } else {
        let vicAmount = inputAmount * 100; // Quy đổi sang VIC
        outputAmount = vicAmount > 0.01 ? vicAmount - 0.01 : 0; // Trừ phí swap
    }

    // ✅ Hiển thị tối đa 4 chữ số thập phân để tránh sai số
    toAmountInput.value = outputAmount > 0 ? outputAmount.toFixed(4) : "0.0000";
}

// 📌 Khi người dùng nhập số lượng token muốn swap
fromAmountInput.addEventListener("input", updateSwapOutput);

// 📌 Khi bấm nút Max, nhập toàn bộ số dư token vào ô nhập
maxButton.addEventListener("click", async () => {
    let fromTokenSymbol = document.getElementById("from-token-symbol").textContent.trim(); // Token nguồn
    let maxAmount = parseFloat(document.getElementById("from-balance").textContent.trim()) || 0; // Số dư hiện tại

    if (maxAmount > 0) {
        fromAmountInput.value = maxAmount.toFixed(4); // Điền số dư tối đa với độ chính xác 4 chữ số thập phân
        updateSwapOutput(); // Cập nhật số lượng token nhận
    }
});
