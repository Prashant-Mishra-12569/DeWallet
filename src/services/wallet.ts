import { ethers } from "ethers";
import { DeWalletABI } from "@/contracts/DeWalletABI";

const CONTRACT_ADDRESS = "0x608b7f1ef01600C33e34C585a85fAE8ECAfEC6D2";
const ALCHEMY_API_KEY = "cUnkmV9JNeKd-cc5uviKiJIsy6BmtSY8";

export const getContract = () => {
  const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
  const signer = new ethers.Wallet(localStorage.getItem("privateKey") || "", provider);
  return new ethers.Contract(CONTRACT_ADDRESS, DeWalletABI, signer);
};

export const sendTransaction = async (to: string, amount: string) => {
  const contract = getContract();
  const tx = await contract.transferETH(to, { value: ethers.parseEther(amount) });
  return tx.wait();
};

export const sendToken = async (tokenAddress: string, to: string, amount: string) => {
  const contract = getContract();
  const tx = await contract.transferToken(tokenAddress, to, ethers.parseEther(amount));
  return tx.wait();
};

export const estimateGas = async (to: string, value: string) => {
  const contract = getContract();
  return await contract.estimateGasFee(to, ethers.parseEther(value));
};