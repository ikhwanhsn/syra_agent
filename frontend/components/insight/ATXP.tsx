import toast from "react-hot-toast";
import { AnimateIcon } from "../animate-ui/icons/icon";
import { Input } from "../ui/input";
import { useState } from "react";
import { Search } from "../animate-ui/icons/search";
import { useQuery } from "@tanstack/react-query";
import { marked } from "marked";
import Image from "next/image";

const ATXPComponent = () => {
  const [valueSearch, setValueSearch] = useState("");
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [result, setResult] = useState(null);
  const [citations, setCitations] = useState([]);
  const { data: sundown } = useQuery({
    queryKey: ["cryptoNewsSundown"],
    queryFn: () => fetch(`/api/cryptonews/sundown`).then((res) => res.json()),
  });
  const { data: news } = useQuery({
    queryKey: ["cryptoNewsNews"],
    queryFn: () => fetch(`/api/cryptonews/news`).then((res) => res.json()),
  });
  const handleInputSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueSearch(e.target.value);
  };

  const handleSearch = async () => {
    setLoadingSearch(true);
    const res = await fetch(`/api/atxp/x?query=${valueSearch}`);
    const data = await res.json();
    console.log("data", data);

    if (data.message.status === "success") {
      const html: any = marked.parse(data.message.message); // convert markdown → HTML
      setResult(html);
      setCitations(data.message.citations);
      setLoadingSearch(false);
    } else {
      toast.error(data.message.message);
      setLoadingSearch(false);
    }
  };

  return (
    <div className="bg-white py-2 rounded-md shadow-md min-h-[700px] max-w-7xl px-4 mx-3 xl:mx-auto mb-5">
      <div className="sm:flex items-center justify-between space-y-3 sm:space-x-0">
        <h1 className="text-2xl font-bold text-gray-800">Insight</h1>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search news, data, information..."
            value={valueSearch}
            onChange={handleInputSearch}
            className="h-12 w-full sm:w-64 md:w-96 placeholder:text-base text-lg!"
          />
          <AnimateIcon
            animateOnHover
            loop
            onClick={() => handleSearch()}
            className="cursor-pointer border p-3 rounded-md"
          >
            <Search size={20} animation="find" />
          </AnimateIcon>
        </div>
      </div>
      {loadingSearch && (
        <div className="flex items-center justify-center min-h-screen">
          <Image
            src="/videos/search-animation.gif"
            alt="loading"
            width={150}
            height={150}
          />
        </div>
      )}
      {!loadingSearch && !result && (
        <div className="sm:grid grid-cols-2 gap-1 mt-3">
          <div className="rounded-md bg-gray-50 p-4 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1">Sundown</h3>
            {sundown?.success &&
              sundown?.data?.data?.map((item: any) => (
                <details className="collapse collapse-arrow border-base-300 border">
                  <summary className="collapse-title font-semibold">
                    {item.headline}
                  </summary>
                  <div className="collapse-content text-sm -mt-1">
                    {item.text}
                  </div>
                </details>
              ))}
          </div>
          <div className="rounded-md bg-gray-50 p-4 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1">News</h3>
            {news?.success &&
              news?.data?.data?.map((item: any, index: number) => (
                <details className="collapse collapse-arrow border-base-300 border">
                  <summary className="collapse-title font-semibold">
                    {item.title}
                  </summary>
                  <div className="collapse-content text-sm -mt-1">
                    {item.text}
                  </div>
                </details>
              ))}
          </div>
        </div>
      )}
      <div>
        {!loadingSearch && result && (
          <div
            className="rounded-md bg-gray-50 p-4 flex flex-col gap-1 mt-3"
            dangerouslySetInnerHTML={{ __html: result || "" }}
          />
        )}
        {/* {citations.length > 0 && (
          <div className="rounded-md bg-gray-50 p-4 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1">Citations</h3>
            <div className="collapse-content text-sm">
              {citations.map((item: any, index: number) => (
                <div key={index}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ATXPComponent;
