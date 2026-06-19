import  {mockData}  from "../../data/marketData";
import AutoMarketAnalysis from "../../components/AutoMarketAnalysis";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
export default function MarketPage() {
  return(
    <>
      <Header />
      <AutoMarketAnalysis data={mockData} />;
      <Footer />
    </>
    
  ) 
}
