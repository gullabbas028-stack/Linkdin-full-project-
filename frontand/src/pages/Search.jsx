import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Nav from "../components/Nav.jsx";
import useApi from "../hooks/useApi.js";
import dp from "../assets/dp.jpg";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const api = useApi();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(`/user/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!cancelled) setUsers(res.data.users);
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Couldn't complete the search. Please try again.");
          console.error("Search error:", err.response?.data || err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="pt-[74px] min-h-screen bg-[#f3f2ef]">
      <Nav />

      <div className="max-w-[700px] mx-auto py-6 px-4">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">
          {query ? `Results for "${query}"` : "Search for people"}
        </h1>

        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Searching...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-red-500 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && query && users.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No people found matching "{query}".
          </div>
        )}

        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <button
              key={u._id}
              onClick={() => navigate(`/profile/${u.userName}`)}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition text-left"
            >
              <img
                src={u.userprofileimage || dp}
                alt={u.firstName}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {u.headline || `@${u.userName}`}
                </p>
                {u.location && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.location}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
