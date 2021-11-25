import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [followers, setFollowers] = useState(mockFollowers);
  const [repos, setRepos] = useState(mockRepos);

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      // more logic here
      // repos
      // followers

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user exist for your search");
    }
    setIsLoading(false);
  };
  // request loading
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState(0);
  // error
  const [error, setError] = useState({ show: false, msg: "" });
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          // throw an error
          toggleError(true, "sorry you have exceeded your hourly rate limit!");
        }
      })
      .catch((err) => console.log(err));
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        followers,
        githubUser,
        repos,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};
const useGlobalContext = () => {
  return useContext(GithubContext);
};
export { GithubProvider, useGlobalContext };
