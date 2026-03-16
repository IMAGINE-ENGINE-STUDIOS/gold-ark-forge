import React from 'react';

interface SlideLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const SlideLayout = ({ children, className = '' }: SlideLayoutProps) => (
  <div
    className={`slide-content relative w-[1920px] h-[1080px] overflow-hidden ${className}`}
    style={{ background: 'linear-gradient(145deg, hsl(213,35%,10%) 0%, hsl(213,32%,16%) 60%, hsl(213,28%,20%) 100%)' }}
  >
    {/* Ornate corners */}
    <span className="ornate-corner ornate-corner-tl" />
    <span className="ornate-corner ornate-corner-tr" />
    <span className="ornate-corner ornate-corner-bl" />
    <span className="ornate-corner ornate-corner-br" />
    {children}
  </div>
);

export default SlideLayout;
