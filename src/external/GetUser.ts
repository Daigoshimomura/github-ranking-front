import AppClient from "../util/AppClient";
import gql from "graphql-tag";
import { GetUserRes } from "./data/GetUserRes";
import { ApolloQueryResult } from "apollo-boost";
import fetcher from "../util/Fetcher";
import { UserDetailRes } from "./data/UserDetailRes";
import { UserExistsRes } from "./data/UserExistsRes";
import { NOTFOUND } from "dns";

export async function getUser(loginUserId: String) {
  const query = gql`
    {
        user(login: "${loginUserId}") {
          avatarUrl
          repositories(first:100,ownerAffiliations:OWNER,orderBy:{field: STARGAZERS,direction:DESC}) {
            nodes {
              id
              name
              url
              primaryLanguage{
                name
              }
              forks{
                totalCount
              }
              watchers{
                totalCount
              }
              viewerHasStarred
              stargazers {
                totalCount
              }
            }
            totalCount
          }
          followers{
            totalCount
          }
          pullRequests{
            totalCount
          }
          issues{
            totalCount
          }
        }
      }
  `;
  return await AppClient.query({
    query
  })
    .then(function(result: ApolloQueryResult<GetUserRes>) {
      result.data.user.userId = loginUserId;
      return result.data;
    })
    .catch(t => {
      const res: GetUserRes = {
        user: {
          userId: "",
          avatarUrl: "",
          repositories: { nodes: [], totalCount: 0 },
          followers: { totalCount: 0 },
          pullRequests: { totalCount: 0 },
          issues: { totalCount: 0 }
        }
      };
      return res;
    });
}

export async function entryUser(user: GetUserRes) {
  const endpoint = process.env.REACT_APP_BACKEND_ENDPOINT as string;
  const url = "/github-ranking/userentry";

  await fetcher(endpoint + url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify(user)
  });
}

async function getUserDetail(userId: string) {
  const endpoint = process.env.REACT_APP_BACKEND_ENDPOINT as string;
  const url = "/github-ranking/user/detail?";
  let params = new URLSearchParams();
  params.set("userId", userId);
  return await fetcher<UserDetailRes>(endpoint + url + params.toString(), {
    headers: {
      Accept: "application/json"
    },
    method: "GET"
  });
}

export async function existsUser(userId: string) {
  const endpoint = process.env.REACT_APP_BACKEND_ENDPOINT as string;
  const url = "/github-ranking/user/exists?";
  let params = new URLSearchParams();
  params.set("userId", userId);
  return await fetcher<UserExistsRes>(endpoint + url + params.toString(), {
    method: "GET"
  });
}

export async function getUserData(userId: string) {
  const exists = await existsUser(userId);

  if (exists.exists) {
    const detail = await getUserDetail(userId);
    return detail;
  } else {
    const userRes = await getUser(userId);

    // 見つからなかった場合
    if (userRes.user.avatarUrl === "") {
      console.log("ex");
      let res: UserDetailRes = {
        userName: "",
        userId: NOTFOUND,
        avatarUrl: "",
        tier: "",
        rank: 0,
        score: 0,
        currentNumber: 0,
        followersCount: 0,
        issuesCount: 0,
        pullRequestCount: 0,
        repositoriesCount: 0,
        forksCountTotal: 0,
        stargazerCountTotal: 0,
        watchersCountTotal: 0,
        mainLanguage: ""
      };
      return res;
    }
    // 見つかった場合はDB保存
    await entryUser(userRes);
    const detail = await getUserDetail(userId);
    return detail;
  }
}
