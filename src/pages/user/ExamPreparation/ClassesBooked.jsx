import { useEffect, useState } from "react";
import { getStudentClasses } from "../../../api/examPrepApi";
import { useAuth } from "../../../context/AuthContext";
import Modal from "react-modal";

const ClassesBooked = ({
  isOpen,
  onClose,
  bookedClassesCount: bookedClassesCountProp = 0,
  totalAvailableClasses: totalAvailableClassesProp = 10,
}) => {
  const { user } = useAuth();
  const [bookedClassesCount, setBookedClassesCount] = useState(bookedClassesCountProp);
  const [totalAvailableClasses, setTotalAvailableClasses] = useState(totalAvailableClassesProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    setLoading(true);
    setError(null);
    getStudentClasses(user.uid)
      .then((res) => {
        setBookedClassesCount(res.classes?.length || 0);
        setTotalAvailableClasses(res.totalAvailableClasses || 10);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed left-1/2 top-1/2 flex w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[24px] bg-white p-8 font-urbanist shadow-2xl outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
      ariaHideApp={false}
    >
      {/* Success Icon */}
      <img
        src="/svgs/success-icon.svg"
        alt="Success"
        className="mx-auto mb-4"
      />
      {/* Success Message */}
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-xl font-bold text-black">Classes Booked!</h2>
        <div className="space-y-2">
          <p className="text-base font-semibold text-[#5D5D5D]">
            You booked{" "}
            <span>{String(bookedClassesCount).padStart(2, "0")}</span> out of{" "}
            {totalAvailableClasses} available classes
          </p>
          <p className="text-base font-normal text-gray-500">
            Best of luck of your exam preparations.
          </p>
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="w-full rounded-full border border-[#042F0C] bg-white px-5 py-2 text-base font-medium text-black transition-colors hover:bg-gray-50"
      >
        Done
      </button>
    </Modal>
  );
};

export default ClassesBooked;
