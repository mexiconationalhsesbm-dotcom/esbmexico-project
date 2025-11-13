"use client";
import React from "react";
import Image from "next/image"; 
import Link from "next/link";

export const Folders = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/leadershipFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 text-center dark:text-gray-400">
            Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90">
              Leadership
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}

            {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/governanceFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 text-center dark:text-gray-400">
            Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90">
              Governance
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}

            {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/ciFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 text-center dark:text-gray-400">
            Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90 text-center">
              Curriculum & Instructions
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}

            {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/hrtdFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 text-center dark:text-gray-400">
            Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90 text-center">
              Human Resource and Team Development
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}

            {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/rmmFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 text-center dark:text-gray-400">
            Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90 text-center">
              Resource Management & Mobilization
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <Link href={"/dashboard/leFiles"} className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="p-2 flex items-center justify-center w-fit h-fit bg-gray-100 rounded-xl dark:bg-gray-800">
          <Image
            width={40}
            height={40}
            src="/images/icons/folder.svg"
            className="h-[60px] w-[60px]"
            alt="folder"
            />          
        </div>

        <div className="flex items-center justify-center mt-5">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Dimension
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-xl dark:text-white/90">
              Learning Environment
            </h4>
          </div>
        </div>
      </Link>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
