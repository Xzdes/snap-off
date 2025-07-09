export function createState(props) {
  // Начальное состояние зависит от пропсов
  return { 
    count: props.initialValue || 0,
    message: "Нажмите на кнопки"
  };
}

export const events = {
  increment: (state, payload) => {
    // Возвращаем НОВЫЙ объект состояния
    return { 
      ...state, 
      count: state.count + 1,
      message: "Увеличили!"
    };
  },
  decrement: (state) => {
    return { 
      ...state, 
      count: state.count - 1,
      message: "Уменьшили!"
    };
  },
};