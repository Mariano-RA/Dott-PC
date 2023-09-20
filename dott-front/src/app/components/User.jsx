"use client";
import { Fragment, useEffect, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import useSWR from "swr";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const fetcher = async (uri) => {
  const response = await fetch(uri);
  return response.json();
};

export default withPageAuthRequired(function User() {
  const { data, error } = useSWR("/api/roles", fetcher);
  const [usrRoles, setUsrRoles] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (data != undefined) {
      if (data.roles.length > 0) {
        setUsrRoles(data.roles);
      }
    }
  }, [data]);

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="relative flex rounded-full hover:ring-1 hover:ring-red-500 hover:ring-offset-1 hover:ring-offset-transparent">
          <span className="absolute -inset-1.5" />
          <span className="sr-only">Open user menu</span>
          <img className="h-8 w-8 rounded-full" src={user.picture} alt="" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {usrRoles.includes("admin") ? (
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/admin"
                  className={classNames(
                    active ? "bg-gray-100" : "",
                    "block px-4 py-2 text-sm text-red-700"
                  )}
                >
                  Admin
                </a>
              )}
            </Menu.Item>
          ) : (
            ""
          )}
          <Menu.Item>
            {({ active }) => (
              <a
                href="/api/auth/logout"
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block px-4 py-2 text-sm text-red-700"
                )}
              >
                Sign out
              </a>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
});

// const User = () => {
//   const { user } = useUser();

//   return (
//     <Menu as="div" className="relative ml-3">
//       <div>
//         <Menu.Button className="relative flex rounded-full hover:ring-1 hover:ring-red-500 hover:ring-offset-1 hover:ring-offset-transparent">
//           <span className="absolute -inset-1.5" />
//           <span className="sr-only">Open user menu</span>
//           <img className="h-8 w-8 rounded-full" src={user.picture} alt="" />
//         </Menu.Button>
//       </div>
//       <Transition
//         as={Fragment}
//         enter="transition ease-out duration-100"
//         enterFrom="transform opacity-0 scale-95"
//         enterTo="transform opacity-100 scale-100"
//         leave="transition ease-in duration-75"
//         leaveFrom="transform opacity-100 scale-100"
//         leaveTo="transform opacity-0 scale-95"
//       >
//         <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//           <Menu.Item>
//             {({ active }) => (
//               <a
//                 href="/admin"
//                 className={classNames(
//                   active ? "bg-gray-100" : "",
//                   "block px-4 py-2 text-sm text-red-700"
//                 )}
//               >
//                 Admin
//               </a>
//             )}
//           </Menu.Item>
//           <Menu.Item>
//             {({ active }) => (
//               <a
//                 href="/api/auth/logout"
//                 className={classNames(
//                   active ? "bg-gray-100" : "",
//                   "block px-4 py-2 text-sm text-red-700"
//                 )}
//               >
//                 Sign out
//               </a>
//             )}
//           </Menu.Item>
//         </Menu.Items>
//       </Transition>
//     </Menu>
//   );
// };

// export default User;
