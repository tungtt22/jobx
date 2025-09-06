"use client";

import { useState } from "react";

const mockJobs = [
  {
    id: 1,
    title: "Frontend Developer (ReactJS)",
    company: "Tech Solutions",
    location: "Remote",
    type: "Full-time",
    salary: "$1,500 - $2,500",
    description: "Build and maintain modern web applications using ReactJS.",
  },
  {
    id: 2,
    title: "Backend Developer (Node.js)",
    company: "Innovatech",
    location: "Hanoi",
    type: "Part-time",
    salary: "$1,000 - $1,800",
    description: "Develop RESTful APIs and microservices with Node.js.",
  },
  {
    id: 3,
    title: "UI/UX Designer",
    company: "FreelanceHub",
    location: "Remote",
    type: "Freelance",
    salary: "$800 - $1,200",
    description: "Design user interfaces and experiences for web/mobile apps.",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [jobs, setJobs] = useState(mockJobs);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = mockJobs.filter((job) => {
      const matchTitle = job.title.toLowerCase().includes(search.toLowerCase());
      const matchLocation = location
        ? job.location.toLowerCase().includes(location.toLowerCase())
        : true;
      const matchType = type ? job.type === type : true;
      return matchTitle && matchLocation && matchType;
    });
    setJobs(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2 text-blue-700">Find Freelance Jobs</h1>
        <p className="text-gray-600">Discover hundreds of freelance jobs that fit you</p>
      </header>
      <form
        className="w-full max-w-2xl bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row gap-4 mb-8"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          placeholder="Search jobs (e.g. React, Node, Designer...)"
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location (e.g. Remote, Hanoi...)"
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-blue-400"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-blue-400"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Job type</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Freelance">Freelance</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>
      <main className="w-full max-w-2xl">
        {jobs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No jobs found.</div>
        ) : (
          <ul className="space-y-6">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col gap-2 border-l-4 border-blue-500"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-xl font-semibold text-blue-700">{job.title}</h2>
                  <span className="text-sm text-gray-500">{job.company}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>📍 {job.location}</span>
                  <span>💼 {job.type}</span>
                  <span>💰 {job.salary}</span>
                </div>
                <p className="text-gray-700 mt-2">{job.description}</p>
                <button className="mt-3 self-end bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition text-sm font-medium">
                  Apply now
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="mt-16 text-gray-400 text-sm">
        © {new Date().getFullYear()} JobX - Freelance job search platform
      </footer>
    </div>
  );
}
