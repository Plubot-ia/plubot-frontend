export const createRippleEffect = (event) => {
  const button = event.currentTarget.querySelector('button');
  if (!button) return;

  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);

  circle.style.width = `${diameter}px`;
  circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`;
  circle.classList.add('ripple');

  const [ripple] = button.querySelectorAll('.ripple');
  if (ripple) {
    ripple.remove();
  }

  button.append(circle);
};
