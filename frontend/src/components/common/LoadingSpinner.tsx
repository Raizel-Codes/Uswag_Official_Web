export default function LoadingSpinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
