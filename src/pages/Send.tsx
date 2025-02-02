import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ethers } from "ethers";
import { DeWalletABI, CONTRACT_ADDRESS } from "@/contracts/DeWalletABI";
import BottomNav from "@/components/BottomNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const Send = () => {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: ethBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['ethBalance'],
    queryFn: async () => {
      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const walletAddress = localStorage.getItem("walletAddress");
      if (!walletAddress) return "0";
      const balance = await provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    }
  });

  const handleSend = async () => {
    if (!to || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const encryptedKey = localStorage.getItem("encryptedPrivateKey");
    const seedPhrase = localStorage.getItem("seedPhrase");
    const walletAddress = localStorage.getItem("walletAddress");
    
    if (!encryptedKey || !seedPhrase || !walletAddress) {
      toast({
        title: "Error",
        description: "No wallet found. Please create a wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedKey, seedPhrase);
      const signer = wallet.connect(provider);
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DeWalletABI, signer);

      toast({
        title: "Confirming Transaction",
        description: "Please wait while we process your transaction...",
      });

      const parsedAmount = ethers.parseEther(amount);

      // Get network gas limit
      const block = await provider.getBlock('latest');
      const networkGasLimit = block ? block.gasLimit : BigInt(30000000);

      let tx;
      if (selectedToken === "ETH") {
        // Estimate gas for this specific transaction
        const gasEstimate = await provider.estimateGas({
          from: signer.address,
          to: CONTRACT_ADDRESS,
          value: parsedAmount,
          data: contract.interface.encodeFunctionData('transferETH', [to])
        });

        // Use 60% of network gas limit or estimated gas * 1.2, whichever is lower
        const maxGasLimit = networkGasLimit * BigInt(60) / BigInt(100);
        const estimatedWithBuffer = gasEstimate * BigInt(120) / BigInt(100);
        const gasLimit = estimatedWithBuffer < maxGasLimit ? estimatedWithBuffer : maxGasLimit;

        tx = await contract.transferETH(to, {
          value: parsedAmount,
          gasLimit: gasLimit
        });
      } else {
        // Similar gas estimation for token transfers
        const gasEstimate = await provider.estimateGas({
          from: signer.address,
          to: CONTRACT_ADDRESS,
          data: contract.interface.encodeFunctionData('transferToken', [selectedToken, to, parsedAmount])
        });

        const maxGasLimit = networkGasLimit * BigInt(60) / BigInt(100);
        const estimatedWithBuffer = gasEstimate * BigInt(120) / BigInt(100);
        const gasLimit = estimatedWithBuffer < maxGasLimit ? estimatedWithBuffer : maxGasLimit;

        tx = await contract.transferToken(
          selectedToken,
          to,
          parsedAmount,
          { gasLimit }
        );
      }

      toast({
        title: "Transaction Pending",
        description: "Your transaction is being processed on the blockchain...",
      });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed. Please try again.");
      }

      await refetchBalance();

      toast({
        title: "Success",
        description: "Transaction completed successfully!",
      });

      setTo("");
      setAmount("");
    } catch (error) {
      console.error("Error sending transaction:", error);
      let errorMessage = "Failed to send transaction";
      
      if (error instanceof Error) {
        if (error.message.includes("execution reverted")) {
          if (error.message.includes("Wallet is not active")) {
            errorMessage = "Your wallet is not active. Please create or recover your wallet first.";
          } else if (error.message.includes("Insufficient balance")) {
            errorMessage = "Insufficient balance for this transaction.";
          } else if (error.message.includes("Amount must be greater than 0")) {
            errorMessage = "Amount must be greater than 0.";
          } else if (error.message.includes("Invalid address")) {
            errorMessage = "Invalid recipient address.";
          } else {
            const match = error.message.match(/"message":"([^"]+)"/);
            errorMessage = match ? match[1] : "Transaction failed. Please try again.";
          }
        } else if (error.message.includes("gas limit")) {
          errorMessage = "Transaction would exceed gas limits. Try a smaller amount.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Send</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token</label>
            <Select
              value={selectedToken}
              onValueChange={setSelectedToken}
            >
              <SelectTrigger className="bg-gray-900 border-gray-800">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">Sepolia ETH ({ethBalance || "0"} ETH)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className="bg-gray-900 border-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.0001"
              placeholder="0.0"
              className="bg-gray-900 border-gray-800"
            />
            {selectedToken === "ETH" && ethBalance && (
              <p className="text-sm text-gray-400 mt-1">
                Available: {ethBalance} ETH
              </p>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={isLoading || !to || !amount}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Processing..." : "Send"}
          </Button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Send;