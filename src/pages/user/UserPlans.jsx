import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Sidebar from "../../components/Sidebar";

const UserPlans = () => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const [activeTab, setActiveTab] = useState("subscriptions");

  const subscriptionPlans = [
    {
      title: "bammbuu+ Instructor-Led Group Classes",
      description: "Unlimited instructor-led group conversation classes",
      price: 49.99,
      period: "month",
      isPopular: true,
      type: "bammbuuGroups",
      stripeLink: "https://buy.stripe.com/test_14keVY9UVgHjapq4gi",
    },
    {
      title: "Unlimited Class Credits",
      description: "11 private instructor classes",
      price: 149.99,
      period: "month",
      isPopular: false,
      type: "unlimitedCredits",
      stripeLink: "https://buy.stripe.com/test_7sIaFIaYZ2QteFGaEH",
    },
  ];

  const creditPlans = [
    {
      title: "3 Class Credits",
      description: "bammbuu+ classes only",
      price: 59.99,
      isPopular: false,
      type: "credits3",
      stripeLink: "https://buy.stripe.com/test_28o1581op4YB556000",
    },
    {
      title: "5 Class Credits",
      description: "bammbuu+ classes only",
      price: 99.99,
      isPopular: true,
      type: "credits5",
      stripeLink: "https://buy.stripe.com/test_9AQdRU0kl2Qt9lmeUV",
    },
  ];

  const handlePurchase = (plan) => {
    window.location.href = plan.stripeLink;
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">Plans</h1>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between">
          {" "}
          <div className="max-w-2xl p-6 mx-auto">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold">
                Select a plan according to your ease.
              </h2>

              {/* Toggle Switch */}
              <div className="inline-flex p-1 mb-4 bg-gray-100 rounded-full">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${
                activeTab === "subscriptions"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-600"
              }`}
                  onClick={() => setActiveTab("subscriptions")}
                >
                  Subscriptions
                </button>
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
              ${
                activeTab === "credits"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-600"
              }`}
                  onClick={() => setActiveTab("credits")}
                >
                  Class Credits
                </button>
              </div>

              {/* Warning Message for Credits */}
              {activeTab === "credits" && (
                <div className="mb-4 text-sm text-red-500">
                  With class credits you can only book bammbuu+ classes other
                  premium perks are not included.
                </div>
              )}

              {/* Plans */}
              <div className="space-y-4">
                {(activeTab === "subscriptions"
                  ? subscriptionPlans
                  : creditPlans
                ).map((plan, index) => (
                  <div
                    key={index}
                    className="relative p-6 text-left transition-shadow border rounded-xl bg-green-50 hover:shadow-lg"
                    onClick={() => handlePurchase(plan)}
                  >
                    {plan.isPopular && (
                      <span className="absolute px-2 py-1 text-xs bg-yellow-400 rounded-full top-4 right-4">
                        Most Popular
                      </span>
                    )}
                    <h3 className="mb-1 text-lg font-semibold">{plan.title}</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      {plan.period && (
                        <span className="ml-1 text-gray-600">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPlans;
