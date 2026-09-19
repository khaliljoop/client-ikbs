// const API_URL = process.env.NEXT_PUBLIC_API_URL;

// if (!API_URL) {
//   throw new Error(
//     "NEXT_PUBLIC_API_URL n'est pas configurée.",
//   );
// }

// interface RequestOptions extends RequestInit {
//   token?: string;
// }

// export async function apiClient<T>(
//   endpoint: string,
//   options: RequestOptions = {},
// ): Promise<T> {
//   const { token, headers, ...fetchOptions } = options;

//   const response = await fetch(
//     `${API_URL}${endpoint}`,
//     {
//       ...fetchOptions,
//       headers: {
//         "Content-Type": "application/json",
//         ...headers,
//         ...(token
//           ? {
//               Authorization: `Bearer ${token}`,
//             }
//           : {}),
//       },
//     },
//   );

//   if (!response.ok) {
//     const errorBody = await response
//       .json()
//       .catch(() => null);

//     throw new Error(
//       errorBody?.message ??
//         `Erreur API : ${response.status} ${response.statusText}`,
//     );
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json();
// }

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL n'est pas configurée.",
  );
}

interface RequestOptions
  extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    token,
    headers,
    ...fetchOptions
  } = options;

  const requestHeaders =
    new Headers(headers);

  /*
   * On ajoute Content-Type uniquement
   * lorsqu'une requête contient un body.
   *
   * GET / DELETE sans body n'ont donc
   * pas Content-Type: application/json.
   */
  if (
    fetchOptions.body &&
    !requestHeaders.has(
      "Content-Type",
    )
  ) {
    requestHeaders.set(
      "Content-Type",
      "application/json",
    );
  }

  if (token) {
    requestHeaders.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...fetchOptions,
      headers: requestHeaders,
    },
  );

  if (!response.ok) {
    const errorBody =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      errorBody?.message ??
        `Erreur API : ${response.status} ${response.statusText}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}