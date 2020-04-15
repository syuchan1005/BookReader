const useTestId = (id: string) => {
  if (process.env.NODE_ENV === 'production') return {};
  return {
    'data-testid': id,
  };
};

export default useTestId;
