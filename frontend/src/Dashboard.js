import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Plus,
  RefreshCw,
  Trophy,
  ImageIcon,
  MapPin,
  Award,
  Activity,
  Trash2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [myReports, setMyReports] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [view, setView] = useState("my");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://road-damage-detection-qcns.onrender.com";

  const fetchData = async () => {
    try {
      setLoading(true);

      const myRes = await fetch(`${API_URL}/myreports/${username}`);
      const myData = await myRes.json();

      const publicRes = await fetch(`${API_URL}/publicreports`);
      const publicData = await publicRes.json();

      const leaderRes = await fetch(`${API_URL}/leaderboard`);
      const leaderData = await leaderRes.json();

      setMyReports(Array.isArray(myData) ? myData : []);
      setPublicReports(Array.isArray(publicData) ? publicData : []);
      setLeaderboard(Array.isArray(leaderData) ? leaderData : []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "";

    if (path.startsWith("http")) return path;

    const cleanPath = path.startsWith("/") ? path.substring(1) : path;

    return `${API_URL}/${cleanPath}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting report.");
    }
  };

  const totalScore = myReports.reduce(
    (total, report) => total + (report.points || 0),
    0
  );

  const reports = view === "my" ? myReports : publicReports;

  const getConfidenceClass = (conf) => {
    if (conf > 0.7) return "badge-success";
    if (conf > 0.4) return "badge-warning";
    return "badge-danger";
  };

  const formatDamageType = (type) => {
    if (!type) return "Clear Road";

    const t = String(type).toUpperCase();

    if (t === "D00") return "Longitudinal Crack";
    if (t === "D10") return "Transverse Crack";
    if (t === "D20") return "Alligator Crack";
    if (t === "D40") return "Pothole";
    if (t === "NONE") return "Clear Road";
    if (t === "NO_DAMAGE") return "No Damage";
    if (t === "POTHOLE") return "Pothole";
    if (t === "CRACK") return "Crack";

    return type;
  };

  const calculateStats = (reportList) => {
    const stats = {
      crack: 0,
      pothole: 0,
      no_damage: 0,
    };

    reportList.forEach((report) => {
      const type = String(report.damage_type || "")
        .toLowerCase()
        .trim();

      if (
        type === "crack" ||
        type === "d00" ||
        type === "d10" ||
        type === "d20"
      ) {
        stats.crack += 1;
      } else if (type === "pothole" || type === "d40") {
        stats.pothole += 1;
      } else if (
        type === "no_damage" ||
        type === "none" ||
        type === "no damage"
      ) {
        stats.no_damage += 1;
      }
    });

    return [
      {
        name: "Pothole",
        value: stats.pothole,
      },
      {
        name: "Crack",
        value: stats.crack,
      },
      {
        name: "No Damage",
        value: stats.no_damage,
      },
    ].filter((item) => item.value > 0);
  };

  const pieData = calculateStats(reports);

  const COLORS = ["#ef4444", "#eab308", "#22c55e"];

  return (
    <>
      <div className="app-background"></div>

      <div className="page-container animate-fade-in">
        {/* Navigation Bar */}
        <div
          className="glass-card"
          style={{
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Activity
              color="var(--accent-primary)"
              size={32}
            />

            Road Damage

            <span
              style={{
                color: "var(--accent-primary)",
                marginLeft: "6px",
              }}
            >
              Scanner
            </span>
          </h1>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}
            >
              Hi,{" "}
              <span style={{ color: "white" }}>
                {username}
              </span>
            </span>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              <Plus size={18} /> New Scan
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: "14px" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: "32px",
          }}
        >
          {/* Left Sidebar */}
          <div className="animate-fade-up delay-100">
            {/* Total Score */}
            <div
              className="glass-card glass-card-compact hover-lift"
              style={{ marginBottom: "24px" }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                <Award size={16} /> My Total Score
              </h3>

              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  color: "var(--accent-primary)",
                }}
              >
                {totalScore}{" "}
                <span
                  style={{
                    fontSize: "18px",
                    color: "var(--text-secondary)",
                    fontWeight: "500",
                  }}
                >
                  pts
                </span>
              </div>
            </div>

            {/* Leaderboard */}
            <div
              className="glass-card glass-card-compact hover-lift"
              style={{ marginBottom: "24px" }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                <Trophy
                  size={20}
                  color="var(--warning)"
                />
                Top Contributors
              </h3>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {leaderboard.slice(0, 5).map((user, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "12px",
                      marginBottom: "8px",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        width: "32px",
                        textAlign: "center",
                        marginRight: "12px",
                      }}
                    >
                      {index === 0 ? (
                        "🥇"
                      ) : index === 1 ? (
                        "🥈"
                      ) : index === 2 ? (
                        "🥉"
                      ) : (
                        <span
                          style={{
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        flexGrow: 1,
                        fontWeight: "500",
                      }}
                    >
                      {user.username}
                    </div>

                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--accent-primary)",
                      }}
                    >
                      {user.score}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Statistics */}
            {pieData.length > 0 && (
              <div
                className="glass-card glass-card-compact hover-lift"
                style={{ marginBottom: "24px" }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    fontSize: "18px",
                  }}
                >
                  <Activity
                    size={20}
                    color="var(--accent-primary)"
                  />

                  {view === "my"
                    ? "Upload Statistics"
                    : "Global Statistics"}
                </h3>

                <div
                  style={{
                    width: "100%",
                    height: "220px",
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        outerRadius={75}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.8)",
                          border:
                            "1px solid var(--glass-border)",
                          borderRadius: "8px",
                        }}
                        itemStyle={{
                          color: "#fff",
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          paddingTop: "16px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className="animate-fade-up delay-200">
            <div
              className="glass-card"
              style={{ padding: "24px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    background: "rgba(0,0,0,0.3)",
                    padding: "6px",
                    borderRadius: "16px",
                    border:
                      "1px solid var(--glass-border)",
                  }}
                >
                  <button
                    className={`btn ${
                      view === "my"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    style={{
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    onClick={() => setView("my")}
                  >
                    My Uploads
                  </button>

                  <button
                    className={`btn ${
                      view === "public"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    style={{
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    onClick={() => setView("public")}
                  >
                    Public Gallery
                  </button>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={fetchData}
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <RefreshCw
                    className="pulse-circle"
                    size={32}
                    style={{
                      margin: "0 auto",
                      background: "transparent",
                    }}
                  />

                  <p>Syncing database...</p>
                </div>
              ) : reports.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    background:
                      "rgba(255,255,255,0.01)",
                    borderRadius: "16px",
                    border:
                      "1px dashed var(--glass-border)",
                  }}
                >
                  <ImageIcon
                    size={48}
                    color="var(--text-secondary)"
                    style={{
                      marginBottom: "16px",
                      opacity: 0.5,
                    }}
                  />

                  <h3
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    No uploads found
                  </h3>

                  <p
                    style={{
                      color: "var(--text-secondary)",
                      marginBottom: "24px",
                    }}
                  >
                    {view === "my"
                      ? "You haven't uploaded any road damage photos yet."
                      : "No public uploads available."}
                  </p>

                  {view === "my" && (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        navigate("/upload")
                      }
                    >
                      Start Uploading
                    </button>
                  )}
                </div>
              ) : (
                <div className="masonry-grid">
                  {reports.map((r, i) => (
                    <div
                      key={r.id}
                      className={`glass-card glass-card-compact hover-lift animate-fade-up delay-${
                        ((i % 3) + 1) * 100
                      }`}
                    >
                      <img
                        src={getImageUrl(r.image_path)}
                        alt={r.damage_type}
                        className="report-image"
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedImage(
                            getImageUrl(r.image_path)
                          )
                        }
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />

                      <div
                        style={{
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {formatDamageType(
                              r.damage_type
                            )}
                          </div>

                          {view === "my" && (
                            <button
                              onClick={() =>
                                handleDeleteReport(r.id)
                              }
                              style={{
                                background: "transparent",
                                border: "none",
                                color:
                                  "var(--text-secondary)",
                                cursor: "pointer",
                                padding: "4px",
                              }}
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color:
                                "var(--text-secondary)",
                              fontSize: "14px",
                            }}
                          >
                            by @{r.username}
                          </span>

                          <span
                            className={`badge ${getConfidenceClass(
                              r.confidence
                            )}`}
                          >
                            {r.confidence
                              ? `${(
                                  r.confidence * 100
                                ).toFixed(0)}% Match`
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <hr
                        style={{
                          margin: "12px 0",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          fontSize: "14px",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color:
                              "var(--text-secondary)",
                          }}
                        >
                          <MapPin size={14} />

                          {r.latitude ? (
                            <>
                              {`${parseFloat(
                                r.latitude
                              ).toFixed(3)}, ${parseFloat(
                                r.longitude
                              ).toFixed(3)}`}

                              <a
                                href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginLeft: "6px",
                                  padding: "2px 6px",
                                  background:
                                    "var(--accent-primary)",
                                  color: "#fff",
                                  borderRadius: "4px",
                                  textDecoration: "none",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                View
                              </a>
                            </>
                          ) : (
                            "No GPS"
                          )}
                        </span>

                        {view === "my" && (
                          <span
                            style={{
                              fontWeight: "700",
                              color:
                                "var(--accent-primary)",
                            }}
                          >
                            +{r.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          />

          <button
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255, 255, 255, 0.1)",
              border:
                "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              fontSize: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default Dashboard;